# Plan — named snow-crystal animation catalog

- **Phase:** Pre-Phase 7 product/catalog work; no charter phase or scientific gate is reopened
- **Status:** in progress — final-resolution Fleets A/B complete and visually reviewed; Fleet C is
  21/24 complete pending a three-job cadence-only repair; final acceptance remains, with 0/99
  final-resolution slots accepted
- **Started:** 2026-08-29
- **Last touched:** 2026-08-31 by OpenAI Codex (GPT-5)

## Goal

Expand the maker-selected gut-check animations into a type-complete visual catalog based on Kenneth
Libbrecht's 35-name snow-crystal guide. The maker includes every named type that the existing
Gravner–Griffeath solver can grow directly or that can be represented honestly as a composition of
separately grown crystals, and excludes the two types that require new droplet-accretion physics.
Every included type receives at least three animations with small, recorded variations that remain
recognizably within the same named type. Both deliverables remain first-class: a reproducible full
scientific bundle for each distinct G-G growth run and a web presentation whose cold unique payload
for one catalog entry is strictly below 20,000,000 bytes.

This is a morphology-coverage and presentation project. Type labels are operational visual catalog
labels, not a claim that G-G parameters predict natural temperature/supersaturation occurrence.
The source guide itself says there is no definitive exact number of snow-crystal types; this plan
uses its named 35-type chart as the maker-selected catalog boundary:
<https://www.snowcrystals.com/guide/guide.html> and
<https://www.its.caltech.edu/~atomic/snowcrystals/class/snowtypes4.jpg>.

## Scope and route map

The catalog has 35 taxonomy rows, 33 included rows, and two explicit exclusions. The included floor
is therefore `33 types × 3 accepted variants = 99 catalog entries`.

- **GG:** the present `GGSolver` and an existing or newly tuned recipe.
- **GG+:** the same G-G evolution rule with a new deterministic seed geometry, a new environment
  schedule, or a bounded recipe search. This is not a new surface operator.
- **Compose:** a versioned scene manifest instances one or more reproducible GG growth assets at
  explicit transforms and phase offsets. It is labeled as a composed visualization, not as one
  single-crystal solver state.
- **Excluded:** the maker does not authorize a new droplet/accretion solver for this catalog.

| Named type | Route | Current candidate or required work |
|---|---|---|
| Simple Prisms | GG+ | Establish a clean early-stop compact-prism recipe. |
| Solid Columns | GG+ | Audit `fig31`; package a clean canonical column recipe. |
| Sheaths | GG+ | Search the needle/column family for a thin hollow wall. |
| Scrolls on Plates | GG+ probe | Test whether a bounded fixed-lattice recipe can retain a convincing scroll. |
| Triangular Forms | GG+ | Add an intentionally asymmetric deterministic seed. |
| Hexagonal Plates | GG | Audit `fig11` and current plate-family runs; select a cleaner anchor if needed. |
| Hollow Columns | GG | `fig30` is the current anchor candidate. |
| Cups | GG+ probe | Test a recessed/custom column seed and asymmetric axial schedule. |
| Columns on Plates | GG | Audit `fig39` and `fig40` against the type definition. |
| 12-branched Stars | Compose | Instance two sixfold plate/star assets with a 30-degree relative rotation. |
| Stellar Plates | GG | Audit `fig32` and `bentley785`. |
| Bullet Rosettes | Compose | Radially instance a bullet/short-column component. |
| Capped Columns | GG | `fig37` and `fig38` are current anchor candidates. |
| Split Plates & Stars | GG+ | Add a connected asymmetric/double seed; `fig6` is related but not sufficient by name. |
| Radiating Plates | Compose | Radially instance a plate component in multiple orientations. |
| Sectored Plates | GG | `fig9v2` is the current anchor candidate. |
| Isolated Bullets | GG+ | Add a short tapered column/bullet seed and stopping rule. |
| Multiply Capped Columns | GG+ | Extend the existing deterministic environment schedule through multiple transitions. |
| Skeletal Forms | GG+ probe | Run a bounded recipe search with a type-specific acceptance view. |
| Radiating Dendrites | Compose | Radially instance a dendrite component in multiple orientations. |
| Simple Stars | GG | `fig16` is the current anchor candidate. |
| Simple Needles | GG | `fig29` is the current anchor candidate. |
| Capped Bullets | GG+ | Combine a bullet seed with the established column-to-plate schedule. |
| Twin Columns | Compose | Pair column components under an explicit visual twin transform. |
| Irregulars | Compose | Build a clearly labeled visual clump from reproducible GG components. |
| Stellar Dendrites | GG | `fig7` and `fig15` are current anchor candidates. |
| Needle Clusters | GG+ | Add a connected multi-tip seed; use composition only if the GG probe fails its type review. |
| Double Plates | GG | `fig6` is the current scientific anchor; its website exclusion remains visible. |
| Arrowhead Twins | Compose | Pair components under a recorded arrowhead-like twin transform. |
| Rimed | Excluded | Requires supercooled-droplet capture and freezing physics. |
| Fernlike Stellar Dendrites | GG | `fig13` is the current anchor candidate. |
| Crossed Needles | Compose | Cross one needle component at explicit orientations. |
| Hollow Plates | GG+ probe | Search for a stable hollow/recessed plate; `fig11` is related, not accepted by default. |
| Crossed Plates | Compose | Cross one plate component at explicit orientations. |
| Graupel | Excluded | Requires extensive droplet accretion/riming physics. |

Route totals are 24 included GG/GG+ types, nine included Compose types, and two excluded types.
The current 52-item queue is an input candidate pool, not 52 pre-accepted catalog entries. At plan
registration, `out/growth-assets/queue-plus-needles.json` contained 52 items; the matching local
web directory contained 52 growth assets totaling 196,599,652 bytes with a largest asset of
10,003,779 bytes. The separate website index contained 51 entries. These measurements were copied
directly from those three artifacts on 2026-08-29. Existing items count only after the type audit;
one animation may have only one primary catalog type, although Compose scenes may reuse it as a
component.

## Done when

- A strict, tracked catalog manifest contains all 35 guide names exactly once, marks `Rimed` and
  `Graupel` excluded for the maker-selected no-new-physics scope, and marks the other 33 complete.
- Every included named type has at least three distinct accepted catalog entries: lower variation,
  baseline, and upper variation. The total accepted entry count is at least 99, and a validator
  recomputes the per-type counts rather than trusting the report.
- Each three-entry family pins one declared variation driver. GG/GG+ families keep seed, domain,
  stopping rule, camera, and every non-varied input fixed; Compose families keep the component
  recipe and camera fixed while varying one scene parameter. A camera-only change never counts as
  morphology variety.
- The initial variation step is normally 5% in each direction. A type may use a smaller or larger
  recorded step when its parameter is discrete or the 5% result is visually indistinguishable, but
  the accepted lower and upper variants must remain the same named type. A step above 15% is called
  out in the entry rather than silently described as small.
- Every distinct GG/GG+ growth entry has a versioned deterministic recipe, exact seed-geometry
  identity, full final state, approximately 120 scientific mesh frames, growth event table, final
  mesh, metrics/record, and logs. Existing scientific bundles may be reused only by exact identity.
- Every Compose entry has a strict `growth-scene-v1` manifest with component asset identities,
  transforms, scales, phase offsets, and bounds. Its full record binds the component scientific
  bundles; it never presents the composed scene as one solver checkpoint.
- Every entry has a web form whose cold unique payload—including all uniquely referenced component
  growth assets—is less than 20,000,000 bytes and passes the real website decoder. Repeated scene
  instances may share one component payload, but a tiny manifest does not hide additional unique
  bytes required for first playback.
- The generated text table links every accepted entry to its preview, web asset, recipe/scene
  manifest, and scientific-bundle locator. No private or mixed reference image is copied or served.
- Type review records the views that establish the named form. Ambiguous candidates stay pending or
  are replaced; filenames and historic labels alone do not confer acceptance.
- The seed-geometry change receives focused initial-condition and checkpoint tests plus exact
  `npm test`, because it touches `solver-cpu/`. Catalog, composition, and web orchestration receive
  their focused tests, both typechecks, relevant app build, Rule 7 scan, and representative live
  playback checks. Scientific gates are not rerun because this plan changes no gate or validation
  claim.

## Approach

### 1. Freeze a machine-readable taxonomy and audit current assets

Create `named-snow-crystal-catalog-v1` with one stable identifier per chart name, its route,
acceptance notes, three required variant slots, and links. Import candidates from the exact 52-item
queue, the website library index, and the governed scientific owner manifest after the current NAS
publication registers it. Generate the maker-facing Markdown/HTML text table from this manifest so
the table and counts cannot drift.

The audit uses multiple fixed views or the orbit playback for axial features that a face-on PNG
cannot show. It records `accepted`, `near`, or `missing`; only `accepted` fills a variant slot.

### 2. Add deterministic GG+ seed geometry without replacing G-G physics

Add a downstream `GGPlusSolver` initial-condition adapter with a versioned discriminated seed
specification that retains the existing hexagonal-prism case and adds deterministic procedural or
exact-site seeds. The adapter inherits every evolution method from the permanent `GGSolver`; the
byte-frozen `gg-solver.ts` control remains unchanged. Validate bounds, integer lattice coordinates,
duplicates, active-domain membership, and connectedness for single-crystal GG runs. Pin the
generator version plus the exact sorted-site digest in every recipe and bundle. Intentional
asymmetric seeds do not claim D6h symmetry; existing symmetric seeds retain their exact behavior and
tests.

Use the already implemented environment-event path for capped and multiply capped histories.
Do not add a new attachment rule, temperature meaning, or physical interpretation to the G-G
surface parameters.

### 3. Produce coverage before depth

Work in coverage-first passes rather than finishing one type at a time:

1. accept or generate one baseline anchor for every feasible GG/GG+ type;
2. create one baseline scene for every Compose type using accepted components;
3. resolve the bounded probe types (`Scrolls on Plates`, `Cups`, `Skeletal Forms`, and `Hollow
   Plates`) before launching their variant runs;
4. generate the lower variation across all 33 included types; and
5. generate the upper variation across all 33 included types.

This ordering exposes the maximum number of forms early and avoids spending three full runs on an
easy type while another type has no viable recipe.

### 4. Compose multi-orientation forms explicitly

Add a compact `growth-scene-v1` format and preview player support. A scene instances an accepted web
growth asset rather than duplicating its event table, which keeps rosettes and crossed forms under
the payload ceiling. Scientific retention points to the exact component bundles plus the scene
manifest. Scene variation changes one small recorded property such as orientation spread, relative
scale, or phase offset; it does not count camera motion as morphology variation.

Compose contract/player checkpoint (2026-08-29): `app/src/growth-scene.ts` implements strict
`growth-scene-v1` parsing for the composed-visualization disclosure, variation driver, explicit
bounds/camera, component web identities, scientific-bundle identities, transforms, scales and
phase offsets. Its cold-payload calculation counts manifest bytes plus each unique growth-asset
content identity once and rejects inconsistent byte claims. `app/src/growth-asset.ts` ports the
website's load-bearing `gutcheck-growth-v1` checks into an environment-neutral browser decoder and
provides chronological prefix lookup for playback.

The spike player's `?growthScene=` mode fetches and validates the manifest, enforces the strict
20,000,000-byte cold limit, verifies actual component byte length and SHA-256 in the browser,
deduplicates repeated component fetches by content identity, instances recorded lattice cells under
each explicit 3-D transform, applies phase delays, and exposes deterministic seek. Its UI labels the
result as a composed visualization of independently recorded G-G components.

Product-sized verification passed:

- `npx vitest run app/test/growth-scene.test.ts app/test/growth-asset.test.ts
  app/test/spike-gg-realism-frame.test.ts` — three files, eight tests passed
- `npm run typecheck`
- `npm run build --workspace app` — 75 modules transformed
- `node out/named-crystal-catalog/compose-smoke/capture.mjs` — an ignored development-only crossed
  needle scene sought at 4 and 8 seconds; one scene request and one unique 121,806-byte growth
  request served two transformed, phase-shifted instances
- `npm run lint:rule7`
- `git diff --check`

The smoke scene binds a local exploratory probe record, not a complete scientific bundle, and is
therefore player evidence only—not an accepted Compose entry or precedent for weakening the
production scientific-bundle requirement.

Catalog-table refresh checkpoint (2026-08-29): current candidates may now link either an exact
run record or a tracked type-review record. The generated table links the selected Scrolls on
Plates, Triangular Forms and Cups early-stop trios; Hollow Plates cavity-radius 1/2/4; and the new
Solid Column, Sheath, Split Plate and Isolated Bullet baseline anchors. Multiply Capped Columns and
Needle Clusters visibly record their failed direct route and pending scientifically bound Compose
scene. The validator still reports 35 rows, 33 included types, 99 required slots and zero accepted
slots because candidate review alone does not satisfy the dual-output production contract.

- `node scripts/named-crystal-catalog.ts validate`
- `node scripts/named-crystal-catalog.ts table --out docs/named-snow-crystal-catalog.md`
- `npx vitest run runner/test/named-crystal-catalog.test.ts` — one file, four tests passed
- `npm run typecheck`
- `npm run lint:rule7`
- `git diff --check`

### 5. Generate and publish in bounded type tranches

Extend the existing fleet planner to plan by stable type/variant identity, resume by exact recipe,
and give every worker an exclusive output root. Run representative seed and composition samples
before a fleet. Each completed type tranche is inventoried and registered before the next large
tranche starts; no 99-entry all-at-once launch is the first test. Scientific NAS publication and
website copying remain explicit governed transactions, never implicit side effects of growth.

## Steps

- [x] Register the maker-selected 33-type scope, 99-entry floor, route map, payload ceiling, and
      scientific/web dual-output contract in this plan before implementation.
- [x] Add the strict taxonomy/catalog schema, seed its 35 rows, and generate a text-only linked
      coverage table; prove the validator reports 33 included, two excluded, and 99 required slots.
- [x] Import and visually audit the existing 52-item candidate pool without counting labels alone;
      record accepted/near/missing by exact asset identity.
- [x] Specify and implement versioned deterministic custom seeds while leaving the G-G update rule
      bit-unchanged for the existing hexagonal-prism path.
- [ ] Produce one accepted baseline for every GG/GG+ type, running bounded probes first for the four
      uncertain fixed-lattice forms.
- [ ] Implement and round-trip `growth-scene-v1`; produce one accepted baseline for every Compose
      type and measure cold unique web payloads.
- [ ] Pre-register and generate the lower/baseline/upper family for every included type; replace any
      candidate that crosses its type boundary.
- [ ] Generate or bind full scientific bundles and less-than-20,000,000-byte web forms; verify every
      web entry through the real decoder.
- [ ] Publish the final linked table and exact manifest counts, recording actual route totals,
      reused/new run counts, byte totals, checks, and governed asset locators in this plan and
      `docs/PROGRESS.md`.

Implementation checkpoint (2026-08-29): `docs/named-snow-crystal-catalog.json` pins the guide's
35 chart rows in chart order, exact route/exclusion contract, three variant slots per included row,
the strict decimal web ceiling, and current candidate record links without accepting any slot.
`scripts/named-crystal-catalog.ts` strictly parses it, rejects taxonomy/count drift, duplicate
accepted identities, malformed links and payloads at or above the ceiling, independently recomputes
the counts, and generates `docs/named-snow-crystal-catalog.md`. The generated table reports 35 rows,
33 included, two excluded, 24 GG/GG+, nine Compose, 99 required, zero accepted, and 99 remaining.

Product-sized verification passed:

- `node scripts/named-crystal-catalog.ts validate`
- `npx vitest run runner/test/named-crystal-catalog.test.ts` — one file, four tests passed
- `npm run typecheck`

At that first checkpoint the current-candidate links were intake aids only; the following audit
checkpoint supersedes the then-pending visual review. No candidate fills a formal variant slot yet
and no new growth process has started.

Current-asset audit checkpoint (2026-08-29):
`docs/named-snow-crystal-current-assets.json` binds all 52 queue items to the exact web file length
and SHA-256, exact scientific record length and SHA-256, website inclusion, source record, preview
locator, and a manual face or face-plus-oblique morphology assessment. The independently generated
[text table](../named-snow-crystal-current-assets.md) reports 52 assets, 51 website entries, 45
strong visual matches, seven near matches, 196,599,652 total web bytes, and a largest web asset of
10,003,779 bytes against the strict 20,000,000-byte ceiling. `fig6` is the sole current website
exclusion, matching the existing library index. The exact numbers are copied from
`docs/named-snow-crystal-current-assets.json` at this update.

The face review used one generated 52-item contact sheet. Because face-on views hide axial
structure, `fig6`, `fig11`, `fig29`, `fig30`, `fig31`, `fig37`, `fig38`, `fig39`, and `fig40` also
received fixed 55-degree and 85-degree mesh views before classification. Those PNG sheets are
reproducible ignored inspection scratch; the durable output is the path/hash audit plus rationale.
The audit intentionally does not fill formal variants: morphology match, a common one-parameter
family, scientific-bundle binding, and lower/baseline/upper placement are separate checks.

Additional product-sized verification passed:

- `npx vitest run runner/test/named-crystal-catalog.test.ts runner/test/named-crystal-current-audit.test.ts`
  — two files, six tests passed
- `npm run typecheck`
- `npm run lint:rule7`
- `git diff --check`

GG+ seed checkpoint (2026-08-29): the separate `GGPlusSolver` adapter accepts strict version-1
`none`, `hexPrism`, and exact connected `siteOffsets` forms. `solver-cpu/src/gg-solver.ts` is
byte-identical to the frozen permanent control. `GGPlusSolver` constructs that control without a
seed, invokes its existing initialization attachment/boundary path, and inherits every subsequent
evolution method. A 200-tick focused regression compares all three state fields bit-for-bit against
the equivalent permanent-control hexagonal-prism run. Exact-site seeds reject ambiguous legacy
controls, empty or duplicate sites, non-integer coordinates, disconnected components, and sites
outside either the domain or active domain. Caller site order is canonicalized before
initialization; the adapter exposes a sorted copy-safe initial site list.

`scripts/gutcheck-grow-params.ts` accepts the versioned seed in a figure spec. Its scientific record,
timeline manifest, and website growth header carry the exact geometry, site count, and SHA-256 of
the canonical flat-index list. The website header retains numeric seed-radius and thickness bounds
for the existing strict decoder. The run identity already hashes the complete spec, so it binds the
custom seed without changing the frozen version-1 identity layout. A real 20-tick custom-seed run
round-tripped its four-site asymmetric seed through the growth event file and public checkpoint
codec; an equivalent shuffled-site run produced identical 80-tick state fields.

Focused verification passed before the required full solver check:

- `npx vitest run solver-cpu/test/gg-plus-solver.test.ts solver-cpu/test/gg-solver.test.ts
  runner/test/gutcheck-growth-out.test.ts runner/test/phase9-permanent-control-readiness.test.ts` —
  four files, 25 tests passed
- `npm run typecheck`
- `npm run lint:rule7`
- `git diff --check`

The required exact check passed with the canonical Windows temp path:

- `$env:TEMP='C:\Users\HIL_ADMIN\AppData\Local\Temp';
  $env:TMP='C:\Users\HIL_ADMIN\AppData\Local\Temp'; npm test` — 140 files passed, 2,237 tests
  passed, 49 skipped, duration 440.00 seconds

The first exact attempt inherited the host's 8.3-form temp path and failed 41 unrelated path-safety
tests; the canonical path rerun cleared all of them. That first attempt also exposed and caused the
direct-`GGSolver` design rejection recorded below. The final exact run includes the restored frozen
control identity, the separate GG+ adapter, the custom-seed growth/checkpoint round trip, and the
current progress-state invariant.

Coverage-first baseline probe checkpoint (2026-08-29):
`docs/named-snow-crystal-baseline-probes.json` registers exactly one exploratory baseline for each
of the 24 direct-growth catalog rows: 11 unchanged GG recipes and 13 GG+ seed/schedule recipes. Each
job names its exact current-record parameter template, dimensions, tick cap, seed profile, schedule
profile, intended review views, and visual intent. The profile compiler materializes exact
`siteOffsets` into each run spec before launch, so the existing spec hash and seed-site digest bind
the realized initial condition rather than only a profile name. The four bounded fixed-lattice
questions are present in the same coverage pass and remain probes, not accepted types.

`scripts/named-crystal-baseline-probes.ts` independently compares the tranche against the catalog,
requires all 24 unique direct-growth IDs, validates the strict 20,000,000-byte web ceiling, and
records the registered Intel Core Ultra 9 285K host as 24 physical cores / 24 logical processors.
Its run command uses exactly 24 independent single-threaded processes, writes exact argv plus actual
worker count to `launch.json`, keeps separate stdout/stderr and exit-status files per type, and
fails an otherwise successful job if its web growth asset is not strictly below the ceiling. Probe
payloads remain under ignored `out/named-crystal-catalog/baseline-probes-v1/`; only accepted recipes
will advance to the full scientific production tranche.

Product-sized pre-launch verification passed:

- `node scripts/named-crystal-baseline-probes.ts plan` — 24 pending jobs, registered process
  concurrency 24, physical/logical counts 24/24
- `npx vitest run runner/test/named-crystal-baseline-probes.test.ts` — one file, three tests passed;
  all custom profiles constructed as fitting connected seeds
- `npm run typecheck`
- `npm run lint:rule7`
- `git diff --check`

Direct-production execution and acceptance checkpoint (2026-08-30): the registered command
`node scripts/named-crystal-direct-production.ts run` launched 24/24 actual workers and completed
24/24 jobs with zero failures or missing outputs. Its report is
`out/named-crystal-catalog/direct-production-v1/report.json` (567,085 bytes; SHA-256
`ed3153cb3480180555c972ee07c0ec635111deb0773ed9bdcc1726e16dd4ef52`). All 24 web files decoded
through `decodeGrowthAssetV1`; sizes ranged from 4,759 to 361,488 bytes and totalled 3,084,489
bytes, strictly below the 20,000,000-byte ceiling per entry. The scientific payload inventory is
2,924 files / 2,291,163,313 bytes; each timeline contains 101–121 frames, and every checkpoint,
growth endpoint and final frame agrees with its run record.

The three-view contact sheet is
`out/named-crystal-catalog/direct-production-v1/contact-sheet.png` (8,384,905 bytes; SHA-256
`a77d447ecb0ca6b3f4f43de02007d165076f062aa6becbfc4c4ab3677e463346`). Face, 55-degree oblique
and 85-degree axial review accepts all eight trios within their named visual types. The tracked
`docs/named-snow-crystal-direct-production-review.json` binds every spec, web asset, checkpoint,
frame count and complete bundle-tree identity. The strict catalog now fills 24/99 slots and leaves
75. Its generated table links every accepted preview, web asset, recipe and local scientific
bundle. These products remain local ignored output pending a later governed publication; no
durable NAS locator is claimed yet.

Post-run product verification passed:

- `node scripts/named-crystal-direct-production-accept.ts`
- `node scripts/named-crystal-catalog.ts validate` — 35 rows, 24 accepted, 75 remaining
- `npx vitest run runner/test/named-crystal-direct-production.test.ts
  runner/test/named-crystal-direct-production-review.test.ts
  runner/test/named-crystal-catalog.test.ts` — three files, 11 tests passed
- `npm run typecheck`
- `npm run lint:rule7`
- `git diff --check`

Second dual-output production protocol (registered before implementation/launch, 2026-08-30):
generate exactly 24 distinct GG/GG+ entries, three each for the next eight direct-growth families,
under `out/named-crystal-catalog/direct-production-v2/`. Launch exactly 24 independent processes
on the same 24-core host and reuse the v1 output/verification contract: one replay writes full
state, final mesh, 100–122 scientific frames, growth-event file, record and separate logs; the
actual browser decoder and strict `< 20,000,000`-byte web gate must pass before a job succeeds.

The sole family driver is `rho-scale`: multiply the static source `rho`, or every stage's `rho` in
a staged source, by 0.95 / 1.00 / 1.05. This is one schedule-wide driver, not multiple independently
tuned inputs. Hold the exact seed geometry, stage transition ticks, dimensions, tick cap, domain,
RNG seed, noise, extraction recipe and all other G-G parameters fixed within each trio.

| Family | Tracked source | Fixed production dimensions / cap | Source review basis |
|---|---|---|---|
| Simple Prisms | `fig11` record | 400×400×160 / 1,706 ticks | current 52-asset audit: strong compact thick prism |
| Hexagonal Plates | `sweep-t2p5-r0p08` record | 192×192×64 / 6,000 ticks | current audit: strong thin compact plate; bounded scale-down requires post-run review |
| Hollow Columns | baseline probe materialization | 96×96×192 / 6,000 ticks | baseline review: advance |
| Stellar Plates | baseline probe materialization | 256×256×80 / 6,000 ticks | baseline review: advance; domain enlarged from the contacted probe |
| Capped Columns | baseline probe materialization | 144×144×192 / 6,000 ticks | baseline review: advance |
| Sectored Plates | baseline probe materialization | 192×192×64 / 6,000 ticks | baseline review: advance |
| Simple Needles | baseline probe materialization | 96×96×192 / 6,000 ticks | baseline review: advance |
| Fernlike Stellar Dendrites | baseline probe materialization | 256×256×80 / 6,000 ticks | baseline review: advance; domain enlarged from the contacted probe |

The runner must bind the two current-audit sources to their tracked record/spec identities and the
six scale-down sources to their tracked baseline materializations plus advance review. It must
refuse source classification, review, spec-hash, route, dimension, concurrency or output-contract
drift. As in v1, generation does not automatically accept a type: render face/oblique/axial views,
bind the exact report/contact sheet, and fill only the trios that remain within the named form.

Implementation checkpoint (2026-08-30): the manifest, source-binding loader and second-tranche
CLI now materialize the registered 24 jobs without writing the output root. The v1 executor and
dual-output verifier are exported and reused rather than forked, so both tranches enforce the same
record/checkpoint/frame/growth endpoint checks and actual `decodeGrowthAssetV1` web gate. Focused
tests cover 24-job/family/host identity, the exact dimensions and caps, both current-audit source
hashes, static and staged schedule-wide `rho` scaling, the combined output argv and read-only plan.
The two focused files pass 11 tests; `npm run typecheck`, `npm run lint:rule7`, and
`git diff --check` pass. The production output root is still absent at this checkpoint.

Maker resolution correction and final-resolution protocol (2026-08-30): the second fleet completed
24/24 with 24 actual workers, but its deliberately scaled-down domains are screening products, not
final scientific-resolution replacements. The exact report is
`out/named-crystal-catalog/direct-production-v2/report.json` (594,644 bytes; SHA-256
`f5d30f6e896980a19df9716f5400c207c5c9994dce7fcd3804ec0c2ef97b85e1`): all 24 actual web files
decoded, range from 55,268 to 3,576,987 bytes, and total 13,209,463 bytes; the scientific bundles
contain 3,078 files / 6,568,205,710 bytes and 115–121 mesh states per entry. The three-view sheet is
`out/named-crystal-catalog/direct-production-v2/contact-sheet.png` (9,983,672 bytes; SHA-256
`6e849aab1f49ed1e6e107516e42c27578ed6dee37a3d15e7abde5c92d3e6e578`). It shows all eight named
morphologies, but maker direction requires the established large scientific domain scale.

The published 52-animation scientific owner manifest independently confirms that those established
bundles contain 19–121 mesh states, so the 120-state target is format parity rather than a video
frame count. A web growth file carries the complete attachment-event timeline and the viewer renders
it at display cadence. Catalog prose must call the scientific files **mesh states** or **mesh
keyframes**, never imply that a 121-state bundle is a 121-frame rendered movie.

Final direct-production resolution is now registered as follows. A planar final uses at least
500×500×96 unless its exact accepted source is larger. A source-defined compact three-dimensional
form may use its registered native proportions. Needle, hollow-column and sheath finals use at least
128×128×768; capped-column finals use at least 320×320×512. Other tall/custom forms use the explicit
larger domain below. A vertical final must retain at least 16 lattice layers and 5% of `nz`, whichever
is greater, between its occupied mesh bounds and both Z boundaries. The post-run review rejects a
form that is flat in oblique/axial views or fails that clearance, even if the process and decoder
checks pass.

Run two replacement fleets, each exactly 24 jobs / 24 workers. Fleet A rematerializes the eight
second-fleet families from exact strong current-audit sources and varies only schedule-wide `rho` by
0.95 / 1.00 / 1.05. Its final domains/caps are: Simple Prisms 500×500×256 / 1,706; Hexagonal Plates
500×500×96 / 30,000; Hollow Columns 128×128×768 / 25,000; Stellar Plates 500×500×96 / 30,000;
Capped Columns 320×320×512 / 48,350; Sectored Plates 600×600×96 / 67,200; Simple Needles
128×128×768 / 25,075; Fernlike Stellar Dendrites 800×800×96 / 28,512. Bind them respectively to
`fig11`, `sweep-t2p5-r0p08`, `fig30`, `sweep-t2-r0p12`, `fig37`, `fig9v2`, `fig29`, and `fig13`.

Fleet B rematerializes the eight first-fleet families while preserving their reviewed one-driver
recipes. Its final domains are: Solid Columns 192×192×576; Sheaths 128×128×768; Split Plates &
Stars 600×600×96; Isolated Bullets 192×192×576; Scrolls on Plates 500×500×192; Triangular Forms
500×500×96; Cups 256×256×512; Hollow Plates 500×500×96. Preserve the existing per-variant stop
ticks so custom defining features are not grown away: 6,000 / 6,000 / 6,000 for Solid Columns,
Sheaths and Split Plates & Stars; 5,000 for Isolated Bullets; 100/300/400 for Scrolls on Plates;
200/400/600 for Triangular Forms; 100/200/400 for Cups; and 1,500 for Hollow Plates.

Before launching either final-resolution fleet, write a tracked supersession record bound to the
first review and second screen report, clear the 24 scaled-down variants from the strict catalog,
and regenerate its table. This changes completion credit only: preserve every prior output and review
as screening evidence. Then implement a common source-bound final-resolution runner, focused tests,
and read-only plan; commit those artifacts before launch. Final acceptance remains post-run and
three-view, and still requires both the full scientific bundle and actual decoder-verified web file
under 20,000,000 bytes for every accepted entry.

Final-resolution implementation checkpoint (2026-08-30):
`docs/named-snow-crystal-resolution-supersession.json` (36,250 bytes; SHA-256
`7529a3c2ee754f24baf5515bb6b8631670a8423b14194f485dee4c789b080dbd`) now binds the exact first
review, second report/contact sheet, every second-fleet recipe/product/tree identity, and each tall
screen's measured Z clearance. It preserves all products while resetting the strict catalog to
0/99 final-resolution slots. The common manifest/runner independently pins the current audit,
first-fleet recipe manifest and supersession record; refuses route, source classification/spec,
host, output or resolution drift; materializes 24 unique jobs for either fleet; and enforces the
absolute/fractional Z-clearance gate from each completed record. Both read-only fleet plans leave
their output roots absent. Five focused files pass 26 tests, both TypeScript projects pass, and the
Rule 7 scan is clean across 1,077 files; the diff check passes.

Third final-resolution fleet protocol (registered before implementation/launch, 2026-08-30): use
exactly 24 jobs / 24 workers to complete the six remaining direct-growth types. Fifteen jobs are
five strong current-audit families at three schedule-wide `rho` scales (0.95 / 1.00 / 1.05):
Columns on Plates binds `fig39` at 600×600×192 / 14,269 ticks; Skeletal Forms binds `fig19` at
800×800×96 / 60,000; Simple Stars binds `fig16` at 800×800×96 / 38,501; Stellar Dendrites binds
`fig15` at 800×800×96 / 34,502; Double Plates binds `fig6` at 600×600×96 / 42,981. These sources
are all strong in the exact 52-asset audit; their registered source-spec hashes must be independently
recomputed before launch.

Use the other nine jobs for one final-resolution Capped Bullets search at 320×320×512. Bind the
exact reviewed `bullet` custom seed plus `twoStage2500` column-to-plate schedule from the baseline
probe and vary only total stop tick across 2,750, 3,000, 3,250, 3,500, 3,750, 4,000, 4,500, 5,000,
and 5,500. The 2,500-tick transition and every seed/schedule/G-G/execution value remain fixed. This
is not nine catalog variants: three adjacent results advance only if oblique/axial review shows both
a tapered bullet body and a distinct plate cap, the actual decoder/web gate passes, and the same
16-layer / 5%-of-`nz` vertical-clearance gate passes. If fewer than three survive, run one further
bounded adjacent-stop search; do not relabel a capped column as a capped bullet.

Fleet C writes under `out/named-crystal-catalog/final-resolution-c-v1/` and reuses the same full
scientific/output verifier, 100–122 mesh-state contract, real decoder, strict web ceiling, exact
per-worker logs and report. Its manifest/runner/tests must be committed before launch. Fleet C may
be implemented while Fleet A is running, but it must not launch until a 24-worker production lane is
free.

Fleet C implementation checkpoint (2026-08-30): the separate manifest and runner pin all four
tracked source documents by byte length/SHA-256, independently bind the five strong audit
classifications/specs, bind the exact reviewed Capped Bullets retune seed/schedule, and materialize
15 final variants plus the nine registered stop candidates. The post-run path enforces Z clearance
for all three Columns on Plates jobs and all nine Capped Bullets candidates. Both Fleet A/B and C
focused files pass 14 tests, both TypeScript projects pass, the Rule 7 scan is clean across 1,080
files, and the diff check passes. The Fleet C output root remains absent; do not launch it while
Fleet A owns the 24-worker lane.

Fleet C cadence-repair protocol (registered after the completed first pass and before repair
implementation/launch, 2026-08-31): the exact first-pass report is
`out/named-crystal-catalog/final-resolution-c-v1/report.json` (524,024 bytes; SHA-256
`84415852227cc635782358f5f2342173ff47edd9d2b910614a7a1b919e0d320e`). It records 21 completed,
three failed, zero missing and 24 actual workers. All nine Capped Bullets jobs passed, all 12
registered vertical-clearance rows passed, every child solver exited zero, and every web product
decoded below 20,000,000 bytes. The only failures are scientific timeline counts below the
registered 100-frame floor after deterministic early domain contact:

| Exact job | Final tick | First cadence | First frames | Repair cadence | Expected repair frames |
|---|---:|---:|---:|---:|---:|
| `columns-on-plates-upper` | 10,251 | 119 | 88 | 86 | 121 |
| `double-plates-baseline` | 33,737 | 359 | 95 | 282 | 121 |
| `double-plates-upper` | 31,081 | 359 | 88 | 260 | 121 |

Run one bounded repair containing exactly those three jobs in parallel. Keep each job's exact
source/spec hash, dimensions, tick cap, stop policy, seed, noise, domain and G-G schedule unchanged;
change only `framesEvery` to the registered value above. Generate into a separate repair root first,
then fail closed unless the repaired final tick and the SHA-256 identities of `mesh.bin`,
`state.bin`, `record.json`, and `growth-v1.bin` exactly match the first pass. This proves the denser
sampling did not change the solver result or compact web animation. Require 100–122 complete mesh
states and the real browser decoder/web limit before replacing the three failed job directories.
Preserve those original directories in a separate cadence-failure archive and preserve the exact
24-worker first-pass launch in the consolidated Fleet C report; record the three-worker repair
launch separately rather than pretending it was part of the original fleet.

Do not accept 88/95-frame timelines, enlarge domains, change physics or hand-edit the report. The
problem is output sampling against a valid deterministic early stop, so any of those alternatives
would either weaken the preregistered product contract or change an unrelated solver recipe. After
focused repair/reconciliation tests, both typechecks, the Rule 7 scan and diff check pass, commit the
repair implementation before launch. After the repaired report is complete, regenerate and inspect
Fleet C's exact three-view contact sheet before creating the consolidated direct decision.

Fleet C cadence-repair implementation checkpoint (2026-08-31): the tracked repair manifest pins
the exact first-pass report/launch/clearance, three failed jobs, observed final ticks, old/new
cadences and byte identities for each final mesh, checkpoint, record and compact web animation. The
repair runner derives the three jobs from the unchanged Fleet C plan, runs them in a separate root,
revalidates their full products, requires exactly 121 frames and byte-identical solver/web outputs,
then archives the failed directories and writes a provenance-bearing 24/24 consolidated report. It
preserves the original 24-worker launch and records the actual three-worker repair separately. The
read-only plan passes, the three focused files pass 13 tests, both TypeScript projects pass, the
Rule 7 scan is clean across 1,095 files and the diff check passes. Commit this implementation, then
run the exact three-job repair in parallel.

Fleet C repair reconciliation correction (registered after 3/3 repair generation and before any
directory replacement, 2026-08-31): all three repaired jobs produced exactly 121 frames and passed
the real decoder/web ceiling. Their final `mesh.bin` and `state.bin` files are byte-identical to the
first pass. The original byte-identity assertion for `record.json` and `growth-v1.bin` was too broad:
the record deliberately embeds output paths, web byte length and wall-clock elapsed time, while the
web header deliberately embeds the full launch argv, including output root and the changed
`frames-every` / `metrics-every` values. The fail-closed check stopped before moving any directory;
this is provenance metadata drift, not solver-state drift.

Correct the repair verifier without weakening the solver or web claims. Continue to require exact
byte identity for final mesh and checkpoint. For the record, require every field to match after
excluding only output-path strings, web byte length and elapsed seconds. For the compact web asset,
decode both files and require identical event count, seed count, final tick, dimensions, center,
flat-index array and attach-tick array. Before integration, rewrite only repair-root path prefixes in
the generated record and web-header argv to the final Fleet C root; preserve the new cadence values
and event bytes. Re-run the actual decoder and full product inventory after relocation, then write
the repaired exit statuses and consolidated report from those final-root products. Preserve both
raw repair launch/report files in the failure archive. Add focused negative controls for a changed
mesh/checkpoint and changed decoded event table; do not infer semantic growth equality only from a
matching final attached field.

Fleet C reconciliation-correction implementation checkpoint (2026-08-31): the verifier now keeps
byte equality on final mesh/checkpoint, compares every non-provenance record field, and independently
compares both decoded growth arrays plus their scalar contract. Integration relocates only embedded
root strings, preserves the repair cadence/event bytes, re-decodes the final-root web file and
rebuilds each complete bundle inventory/status before consolidation. Negative controls fail on one
changed checkpoint byte, one changed record result and one changed attachment index. The three
focused files pass 15 tests, both TypeScript projects pass, the Rule 7 scan remains clean across
1,095 files and the diff check passes. Commit this correction, then rerun the command; its complete
repair report must skip solver generation and perform reconciliation only.

Final-resolution Fleet C execution/review checkpoint (2026-08-31): the corrected reconciliation
completed without another solver run and produced a complete 24/24 report with the original 24-worker
launch plus explicit three-worker repair provenance. The exact report is
`out/named-crystal-catalog/final-resolution-c-v1/report.json` (686,526 bytes; SHA-256
`0807b91d123516b4cbfc6d9be8306e8a1838b21f36e1f0e76d8363240e380490`). It records 24
decoder-verified web assets from 88,655 to 8,441,989 bytes, total 85,000,701 bytes, all strictly
below 20,000,000 bytes. The scientific bundles contain 3,032 files / 55,888,738,908 bytes with
102–121 mesh states per job. The exact 4,703-byte clearance report (SHA-256
`b368839ad836f358f83bedea994318bc686ba08078869a3e4ff7c880ba5067a0`) passes 12/12 rows.

The reviewed 24-row three-view sheet is
`out/named-crystal-catalog/final-resolution-c-v1/contact-sheet.png` (9,654,924 bytes; SHA-256
`4addc816196a172831df0702b7901d5f2028188076d8aaca1405672015cbee5d`). Visual inspection accepts
all five lower/baseline/upper `rho` trios: Columns on Plates retains a raised central axial structure
over the plate and remains fully framed; Double Plates shows separated plate levels axially;
Skeletal Forms keeps open blocky arms; Simple Stars keeps six primary star arms; and Stellar
Dendrites keeps long side-branched arms. For Capped Bullets, stops 4,500 / 5,000 / 5,500 are the
selected adjacent trio: each shows a long tapered bullet body and distinct hexagonal plate cap, with
the cap visibly broadening across the stop sequence. Earlier stops remain generated search products
but are not catalog variants. The tracked direct decision now pins all three reviewed fleets and
these exact selections; commit it before running the 66-slot acceptance transaction.

Final direct acceptance checkpoint (2026-08-31): the fail-closed transaction accepted 22 families /
66 variants and left exactly 33 Compose variants. The exact consolidated review is
`docs/named-snow-crystal-final-direct-review.json` (92,966 bytes; SHA-256
`31f5566114deae377d0a715bab2938b05750e5c6095a08e6144e6787023223ec`). The generated catalog is
67,780 bytes (SHA-256 `11dffb80d52389775ea4e67eb8755488374485d87295fd8fd00ec23c358e16f8`)
and its text table is 36,227 bytes (SHA-256
`8b3239d25deec281684afc19632585d27b2cbca56fa2c0f8bcacba5b3c43e7e2`). The state transition
exposed two stale focused-test assumptions that copied the live 0/99 catalog; fixtures now derive an
explicit pre-acceptance catalog and the catalog assertions name the live 66/33 state. Both focused
files pass nine tests, both TypeScript projects pass, the Rule 7 scan is clean across 1,097 files and
the diff check passes. Commit this checkpoint, then build all 33 real Compose scenes from the exact
direct review.

Compose materialization/review-helper checkpoint (2026-08-31): the builder completed all 33 real
scene/scientific bundles. The first browser-review request correctly received 403 because the helper
used Vite `/@fs` for an `out/` scene, while the repository security boundary deliberately denies all
raw `out/` access. Do not weaken that boundary. The helper now gives Playwright an exact per-scene
in-memory route map containing only the byte/SHA-verified scene and its byte/SHA-verified component
assets; ordinary app modules continue through the loopback Vite server. JavaScript syntax, Rule 7
and diff checks pass. Commit this correction before restarting the 297-capture pass.

Compose visual-framing correction (registered after the first complete 297-capture review and
before rebuilding scenes, 2026-08-31): the browser evidence is technically complete but fails the
visual catalog gate. The builder wrote one fixed −500…500 cube for every scene. That leaves several
small-component families occupying only a few percent of the frame. The radial bullet/needle and
crossed-needle recipes also vary an Euler Z value that cannot change the local Z axis under the
player's fixed XYZ Euler order, so their nominally radial/crossed instances overlap in direction.
Do not accept or write a Compose decision from these captures.

Correct the existing scene builder without changing component growth assets or the registered
one-driver values. Decode each exact component event table; derive its local lattice-cell AABB at
the maximum supported display Z scale (3.5); transform all eight corners through every registered
instance's scale, XYZ rotation and translation; union them; and add bounded 8% framing padding.
Replace the radial and crossed-needle rotations with a tested polar-axis-to-XYZ-Euler mapping whose
transformed local Z directions are six distinct azimuths or the requested crossing angle. Record the
derived bounds in each scene/report and add negative controls that fail fixed 1,000-unit bounds,
overlapping radial directions and any transformed corner outside the published bounds. Use the
maker-preferred high-visibility `bold-ice` look for review because transparent `glass` has no mesh
edge overlay for instanced cells and is too faint as a catalog visual aid. Rebuild the same 33 scene
IDs, rerun all 297 captures, and visually inspect again before final acceptance.

Final Compose production protocol (registered before implementation, 2026-08-30): after the direct
review binds accepted full-resolution components, generate exactly 33 `growth-scene-v1` entries—
three each for 11 Compose types. The two measured direct failures, Multiply Capped Columns and
Needle Clusters, change from GG+ to Compose atomically with their first accepted scene; final route
totals become 22 direct / 11 Compose / two excluded. Do not change the routes earlier and do not
claim that a scene is one G-G solver state.

| Compose family | Accepted component | One scene driver | Lower / baseline / upper |
|---|---|---|---|
| 12-branched Stars | Simple Star | relative in-plane rotation | 28 / 30 / 32 degrees |
| Bullet Rosettes | Isolated Bullet | radial polar tilt | 48 / 52 / 56 degrees |
| Radiating Plates | Hexagonal Plate | radial polar tilt | 36 / 40 / 44 degrees |
| Radiating Dendrites | Stellar Dendrite | radial polar tilt | 44 / 48 / 52 degrees |
| Multiply Capped Columns | Capped Column | axial instance spacing | 0.90 / 1.00 / 1.10 normalized units |
| Twin Columns | Solid Column | twin opening angle | 8 / 10 / 12 degrees |
| Irregulars | Stellar Plate | deterministic instance scale spread | 0.08 / 0.10 / 0.12 |
| Needle Clusters | Simple Needle | radial polar tilt | 40 / 44 / 48 degrees |
| Arrowhead Twins | Simple Prism | twin opening angle | 54 / 58 / 62 degrees |
| Crossed Needles | Simple Needle | relative crossing angle | 86 / 90 / 94 degrees |
| Crossed Plates | Hexagonal Plate | relative crossing angle | 56 / 60 / 64 degrees |

Repeated instances reuse one unique component content identity wherever possible. Each output
directory contains the strict scene, a scientific-scene bundle manifest that pins every component's
full scientific bundle locator/tree identity, real-browser playback captures, and an inventory of
the scene plus unique component web payloads. Cold bytes are the scene manifest plus each unique
component growth asset exactly once and must be strictly below 20,000,000. The browser must fetch,
hash, decode, seek mid/final time, and render the actual scene; three-view review must accept the
named external form. Camera, color, and duplicate files never count as the variation.

Implement the 11-family recipe manifest and builder before direct generation finishes, but make its
materialization fail closed until the consolidated direct review provides exact accepted component
web byte/SHA-256 and scientific tree identities. Write final scenes under
`out/named-crystal-catalog/final-compose-v1/`. After all 33 pass, bind them into the catalog in one
tracked review and perform the two route changes in the same transaction.

Compose builder checkpoint (2026-08-30): the strict recipe manifest materializes exactly 11
families / 33 unique lower-baseline-upper scene identities and validates the two deferred route
changes without applying them. The builder refuses production while the consolidated direct review
is absent. A complete fixture review then exercised all 33 builds: every scene strictly parsed,
every actual component binary passed `decodeGrowthAssetV1`, repeated content counted once, every
cold payload stayed below the strict ceiling, and every scientific-scene bundle pinned its scene,
direct review, and unique component science identities. The Compose builder plus existing scene and
growth decoder files pass nine focused tests; both TypeScript projects pass; the Rule 7 scan is clean
across 1,083 files. The real output root remains absent pending direct acceptance.

Compose browser-review helper checkpoint (2026-08-30):
`scripts/named-crystal-final-compose-review.mjs` refuses any report other than a complete successful
33-entry final Compose build, rechecks every scene byte length/SHA-256 and cold-byte ceiling, then
loads the real app's strict `growthScene` mode. Readiness therefore follows browser fetch, SHA-256
verification and `decodeGrowthAssetV1` for every unique component. The helper deterministically seeks
start / 55% / final time, writes and hashes 99 captures, and emits a source-report-bound browser
review without accepting catalog rows. `node --check scripts/named-crystal-final-compose-review.mjs`,
`npm run lint:rule7` (1,085 files), and `git diff --check` pass. Real capture remains blocked on the
consolidated direct review and real scene materialization.

Compose review correction protocol (registered before the app/capture change, 2026-08-30): the 99
start/middle/final captures above exercise time but only the scene's one committed camera, so they do
not yet satisfy the plan's separate three-view morphology review. Add capture-only bounded camera
query overrides to strict `growthScene` playback; they may change only review camera tilt/yaw after
the exact scene and components are fetched, hashed and decoded. Update the helper to capture face,
oblique and axial views at each of start / 55% / final time: 33 scenes × three views × three stages =
297 hashed captures. Record the exact view angles in the browser-review artifact and add focused app
tests plus a built-app browser smoke. Until that correction passes, the helper is playback tooling,
not sufficient Compose acceptance evidence.

Compose three-view correction checkpoint (2026-08-30): normal `growthScene` playback now always uses
the committed scene camera; only `capture=1` may apply finite bounded review tilt/yaw. The corrected
helper records face 0°/0°, oblique 55°/15° and axial 85°/0° at start / 55% / final time, writes 297
hashed playback captures, and builds a final-time three-view contact sheet bound into its review.
Eight focused scene/camera tests pass, both TypeScript projects pass, and the app build transforms 76
modules. `node scripts/named-crystal-final-compose-review-smoke.mjs --port 5207` served the built app,
fetched/hashed/decoded an in-memory strict scene component, rendered/sought the axial override,
proved normal playback ignored review params, and refused an out-of-range capture; its rendered PNG
SHA-256 was `7179d18e9f33958313bec382944557db902a612fda33d8dfc0aa3ccc27cd3d75`.
Both review scripts pass `node --check`, the Rule 7 scan is clean across 1,090 files, and the diff
check passes. Real 297-image evidence remains blocked on direct acceptance and scene materialization.

Final Compose acceptance transaction protocol (registered before implementation, 2026-08-30): after
the consolidated direct review materializes all 33 real scenes and the corrected browser helper
finishes, write one tracked `docs/named-snow-crystal-final-compose-decisions.json`. It must pin the
exact Compose report, 297-capture browser-review artifact and its final-time three-view contact sheet
by repository-relative path, byte length and SHA-256, and record one non-empty morphology rationale
for each of the 11 Compose families. Absence of that reviewed decision keeps acceptance unavailable.

Implement one verifier that requires 33 unique successful report entries, strict scene parsing,
actual scene/scientific-bundle byte and SHA-256 agreement, recomputed unique cold bytes below
20,000,000, exact browser-review/source/contact identities, and nine unique face/oblique/axial ×
start/55%/final capture identities for every entry. It must independently hash all 297 capture files.
Only after all checks pass may it write the tracked final Compose review, fill 33 Compose slots, and
change Multiply Capped Columns and Needle Clusters from GG+ to Compose in the same catalog/table
transaction. Final catalog totals must be 99 accepted / zero remaining, 22 direct types / 11 Compose
types / two exclusions. Fixture controls cover report drift, capture drift or missing coverage, cold
payload failure and premature route drift. Production decisions and acceptance remain blocked on the
real direct review, scene build and visual inspection.

Final Compose acceptance implementation checkpoint (2026-08-30):
`scripts/named-crystal-final-compose-accept.ts` now rechecks contained decision/report/browser/contact
identities, all 33 actual scenes and scientific-scene bundles, recomputed unique cold bytes, and all
297 capture files with exact entry/view/stage coverage. It prepares the final review, 33 catalog slots,
two route changes and table before replacing tracked outputs. The catalog parser now accepts exactly
two atomic states: both deferred families GG+ with empty slots, or both Compose with complete trios;
an asymmetric or route/slot-split state is invalid. Six acceptance fixtures cover the terminal
99-slot transaction and every registered failure control. Those six plus four focused catalog tests
pass, both TypeScript projects pass, the Rule 7 scan is clean across 1,092 files, and the diff check
passes. The production decision/review files remain absent pending real generation and visual review.

Final direct-acceptance transaction protocol (registered before implementation, 2026-08-30): after
all three direct fleets complete, render each fleet's exact three-view contact sheet and write one
tracked `docs/named-snow-crystal-final-direct-decisions.json`. It must pin each fleet report, contact
sheet and vertical-clearance report by repository-relative path, byte length and SHA-256; record one
non-empty morphology rationale for every accepted family; accept all lower/baseline/upper results for
the 21 non-search direct families; and name exactly three adjacent Capped Bullets stop candidates in
increasing tick order. Absence of that reviewed decision file keeps direct acceptance unavailable.

Implement one acceptance verifier that independently requires three complete 24-worker reports with
zero failed/missing jobs; 100–122 scientific mesh states; an actual decoder-verified web file strictly
below 20,000,000 bytes; byte/SHA-256 agreement for every selected web asset; a valid scientific bundle
tree identity; exact decision/report/contact/clearance identities; and a passed clearance row for every
registered vertical job. It then writes the consolidated
`docs/named-snow-crystal-final-direct-review.json` with 22 accepted families / 66 accepted variants and
fills exactly those 66 direct catalog slots. No Compose route or slot changes in this transaction.
Fixture tests must cover a complete transaction plus report drift, non-adjacent Capped Bullets, web
identity drift and missing clearance. The production decision file and transaction remain blocked on
real output and visual review.

Final direct-acceptance implementation checkpoint (2026-08-30):
`scripts/named-crystal-final-direct-accept.ts` now verifies contained repository-relative identities
for all three reports, contact sheets and clearance reports; independently enforces report, result,
frame, decoder, web-byte, web-SHA-256, scientific-tree and registered-clearance contracts; decodes
every selected web asset again; and remaps only three adjacent selected Capped Bullets stop ticks to
lower/baseline/upper. It prepares the consolidated 22-family review, 66 direct catalog slots and
generated table completely before replacing any tracked output. The five focused fixtures cover the
complete 66-slot transaction and the four registered failure controls; all five pass, both TypeScript
projects pass, the Rule 7 scan is clean across 1,087 files, and the diff check passes. The production
decision/review files remain absent pending real A/B/C completion and visual review.

Final-resolution Fleet A execution/review checkpoint (2026-08-30): the registered command
`node scripts/named-crystal-final-resolution-production.ts run --fleet a` launched 24 actual workers
on the 24-core / 24-logical-processor Intel Core Ultra 9 285K host and completed 24/24 jobs with zero
failed or missing. The exact report is
`out/named-crystal-catalog/final-resolution-a-v1/report.json` (591,740 bytes; SHA-256
`3f2450ea36371ad66198004e5f66368d59eeccb0e2ac021b46b973a121aa1cfd`). Its decoder-verified web
assets range from 623,976 to 10,923,005 bytes, total 94,183,038 bytes, and all are strictly below the
20,000,000-byte per-entry limit. The scientific bundles contain 3,043 files / 42,323,811,889 bytes
with 109–121 mesh states per entry.

The exact vertical-clearance report is
`out/named-crystal-catalog/final-resolution-a-v1/vertical-clearance.json` (4,225 bytes; SHA-256
`8badf5ef28933e6f3247edff9938ac30fe0345b38839492ae3439a166615f456`) and passes all nine required
tall results. Hollow Columns retain 238–249 Z layers at the closer boundary, Capped Columns retain
106–121, and Simple Needles retain 178–196; every value exceeds its registered absolute/fractional
minimum. The reviewed 24-row three-view sheet is
`out/named-crystal-catalog/final-resolution-a-v1/contact-sheet.png` (10,913,625 bytes; SHA-256
`66222f9f5a84edb1b0132f7d049319b519c199eefa1c4f85f35af40a2572fcdf`). Visual inspection accepts
all eight lower/baseline/upper trios as production candidates: planar families retain their named
face morphology; Hollow Columns and Simple Needles are strongly axial and fully framed; and Capped
Columns retain a long column with distinct caps at both ends. This is a recorded Fleet A review, not
formal catalog acceptance: the tracked direct decision remains blocked until Fleets B/C and their
visual reviews exist. Next launch Fleet B in the now-free registered 24-worker lane.

Final-resolution Fleet B execution/review checkpoint (2026-08-30): the registered command
`node scripts/named-crystal-final-resolution-production.ts run --fleet b` launched 24 actual workers
and completed 24/24 jobs with zero failed or missing. The exact report is
`out/named-crystal-catalog/final-resolution-b-v1/report.json` (568,078 bytes; SHA-256
`51c23843bcbb0953d07fcd4ad0fe2d8734ee07b3c7a73e130fea713c5b8a97fe`). Its decoder-verified web
assets range from 4,769 to 444,686 bytes, total 3,394,785 bytes, and all are strictly below the
20,000,000-byte per-entry limit. The scientific bundles contain 2,924 files / 12,489,068,672 bytes
with 101–121 mesh states per entry.

The exact vertical-clearance report is
`out/named-crystal-catalog/final-resolution-b-v1/vertical-clearance.json` (5,342 bytes; SHA-256
`0ce28de986c0424ea7adc2aabf720180ecfdccb7bfcdfaa8c78f062998235339`) and passes all 12 required
tall results. Cups retain 246–250 Z layers at the closer boundary, Isolated Bullets retain 205–218,
Sheaths retain 321–332, and Solid Columns retain 267–269. The reviewed 24-row three-view sheet is
`out/named-crystal-catalog/final-resolution-b-v1/contact-sheet.png` (8,666,417 bytes; SHA-256
`31dd77b506bf723dd110330e9497acc6c637286f061766b5ee172008b2386cae`). Visual inspection accepts
all eight lower/baseline/upper trios as production candidates: all four registered tall families are
fully framed and preserve their defining axial form; Hollow Plates retain a central cavity; Scrolls
on Plates retain an asymmetric raised scroll; Triangular Forms retain a triangular outline; and
Split Plates & Stars retain a visibly split planar structure. These results remain unaccepted until
the consolidated A/B/C direct decision. Next launch Fleet C in the now-free 24-worker lane and do not
start Compose work concurrently.

Coverage-first execution and review checkpoint (2026-08-29): the registered command
`node scripts/named-crystal-baseline-probes.ts run` launched exactly 24 workers on the Intel Core
Ultra 9 285K host and completed 24/24 jobs. The exact local report is
`out/named-crystal-catalog/baseline-probes-v1/report.json` (40,380 bytes; SHA-256
`68221cc4190f4d28008dfc17c8fb0cf3cfa67347fc741ec4e13f9b767904ed3c`). Web growth assets ranged
from 62,188 to 830,136 bytes, totalled 8,188,899 bytes, and all passed the strict
`< 20,000,000`-byte entry gate. The report records actual worker count 24 and the exact per-job
argv, stdout, stderr and exit status.

The three-view review is recorded in `docs/named-snow-crystal-baseline-probe-review.json` and its
generated text table. Ten results are advance candidates, five are retune candidates, and nine are
failed probes; none fills a formal catalog slot. The reviewed contact sheet is
`out/named-crystal-catalog/baseline-probes-v1/contact-sheet.png` (9,572,070 bytes; SHA-256
`56521b3d836c81f1819b2e6a1134b117c0801aa87810ced7613a08954435ab59`). It was regenerated after a
presentation-only camera correction made orthographic framing account for projected Z extent and
the full three-dimensional camera far plane; pre-correction clipped column renders were excluded
from the morphology review.

Product-sized post-run verification passed:

- `npx vitest run app/test/spike-gg-realism-frame.test.ts
  runner/test/named-crystal-baseline-probe-review.test.ts
  runner/test/named-crystal-baseline-probes.test.ts` — three files, eight tests passed
- `npm run typecheck`
- `npm run build --workspace app` — 73 modules transformed
- `git diff --check`

Hard-form follow-up protocol (registered before implementation/launch, 2026-08-29): use the next
24-core tranche only for the six failed GG+ families whose named feature depends on a custom seed
or schedule. Generate four deterministic jobs per family and vary exactly one family driver while
holding its template, fixed override, dimensions, and stop rule constant (except that the
multiply-capped stop is derived from its schedule interval):

| Named family | One varied driver | Four registered values | Fixed interpretation |
|---|---|---|---|
| Scrolls on Plates | raised scroll-lip height | 1, 2, 3, 4 lattice layers | connected plate plus one raised hooked rim; intentionally asymmetric |
| Triangular Forms | triangular seed side length | 5, 6, 7, 8 sites | reduced fixed vapor and early stop so G-G growth does not erase the seed immediately |
| Cups | cup-wall height | 2, 3, 4, 5 lattice layers | filled base plus one open annular wall |
| Multiply Capped Columns | alternating stage interval | 700, 900, 1,100, 1,300 ticks | three column/plate pairs; total stop is six intervals |
| Needle Clusters | radial tip separation | 2, 3, 4, 5 lattice sites | six connected base spokes with separated axial tips |
| Hollow Plates | central cavity radius | 1, 2, 3, 4 lattice sites | fixed-radius three-layer annular plate; this explicitly tests whether G-G preserves the cavity |

The runner must independently require exactly those six failed-probe IDs from the bound first-pass
review, materialize exact seed sites/schedules into each spec, require 24 unique jobs and 24 actual
workers on this host, and fail each web artifact at `>= 20,000,000` bytes. Outputs stay ignored
under `out/named-crystal-catalog/hard-form-probes-v1/`. This remains an exploratory fixed-lattice
test: failure does not authorize new physics, and visual resemblance does not fill a catalog slot.

The registered implementation is `docs/named-snow-crystal-hard-form-probes.json` plus
`scripts/named-crystal-hard-form-probes.ts`. Pre-launch verification passed:

- `node scripts/named-crystal-hard-form-probes.ts plan` — 24 pending jobs, six four-variant
  families, registered process concurrency 24 and 24/24 physical/logical counts
- `npx vitest run runner/test/named-crystal-hard-form-probes.test.ts` — one file, three tests passed;
  all materialized seeds constructed as fitting connected seeds and all six-stage schedules matched
  their one interval driver
- `npm run typecheck`
- `npm run lint:rule7`
- `git diff --check`

Hard-form execution and review checkpoint (2026-08-29):
`node scripts/named-crystal-hard-form-probes.ts run` launched exactly 24 workers and completed
24/24 jobs. The exact local report is
`out/named-crystal-catalog/hard-form-probes-v1/report.json` (47,848 bytes; SHA-256
`21475d310edcc231fe1f5429d42684ac0bbb92f047c060acf7249570aa281ddf`). Web assets ranged from
34,549 to 507,663 bytes and totalled 2,895,660 bytes; all passed the strict 20,000,000-byte ceiling.
The reviewed three-view contact sheet is
`out/named-crystal-catalog/hard-form-probes-v1/contact-sheet.png` (8,533,252 bytes; SHA-256
`433c74c3984f904d2aa415cfd47e6caa8567f5a6b93fd7cd3afd13591e6ef6a9`).

The family-level review in `docs/named-snow-crystal-hard-form-probe-review.json` advances Hollow
Plates: all four cavity radii retain the named cavity. It sends Multiply Capped Columns and Needle
Clusters to explicit Compose because the single-lattice schedules/seeds produced no separated cap
levels and no spatially distinct needle cluster. It keeps Scrolls on Plates, Triangular Forms and
Cups on GG+ for one bounded early-stop search because their custom seed contains the desired
feature but the registered duration erases it. These decisions still fill zero formal slots; the
catalog routes change only when their production recipe/scene exists.

Early-stop follow-up protocol (registered before implementation/launch, 2026-08-29): run one final
fixed-lattice search only for Scrolls on Plates, Triangular Forms and Cups. Reuse the exact
materialized hard-form spec for scroll-lip height 3, triangle side length 8, and cup-wall height 4;
do not change the seed, G-G parameters, domain, dimensions, RNG seed, noise, or render criteria.
Vary only the stop tick across `100, 200, 300, 400, 600, 800, 1,000, 1,200`, producing eight jobs
per family and exactly 24 jobs total. Launch all 24 as independent processes on this host and keep
the strict web gate at `< 20,000,000` bytes.

An early-stop family advances only if at least three variants both attach new sites beyond the
registered initial seed and retain the named external feature in the registered views. A static
seed with negligible growth is not an animation acceptance. If the search fails, stop direct G-G
work for that type: move it to explicit Compose only when available components can make an honest
visual scene, otherwise keep it visibly unsupported under the no-new-physics constraint. Outputs
stay ignored under `out/named-crystal-catalog/early-stop-probes-v1/`.

The registered implementation is `docs/named-snow-crystal-early-stop-probes.json` plus
`scripts/named-crystal-early-stop-probes.ts`. It derives the fixed source specs from the bound
hard-form manifest/review, records initial seed counts and final new-site counts, and writes exact
argv, actual worker count, separate logs/exit status, and the strict web check. Pre-launch
verification passed:

- `node scripts/named-crystal-early-stop-probes.ts plan` — 24 pending jobs, three eight-stop
  families, process concurrency 24, physical/logical counts 24/24
- `npx vitest run runner/test/named-crystal-early-stop-probes.test.ts` — one file, two tests passed;
  every within-family spec is identical after removing its descriptive label
- `npm run typecheck`
- `npm run lint:rule7`
- `git diff --check`

Early-stop execution and review checkpoint (2026-08-29):
`node scripts/named-crystal-early-stop-probes.ts run` launched exactly 24 workers and completed
24/24 jobs in the registered interval. The exact local report is
`out/named-crystal-catalog/early-stop-probes-v1/report.json` (50,418 bytes; SHA-256
`4b09087bbcf515f527bc8fa5e281b51f5be9661a86d53be61e564f41f7a74db3`). Every job attached new
sites beyond its seed; per-family ranges were 74–6,137 for Scrolls on Plates, 27–2,313 for
Triangular Forms, and 66–3,174 for Cups. Web assets ranged from 4,105 to 53,312 bytes and totalled
375,230 bytes, all below the strict ceiling. The reviewed contact sheet is
`out/named-crystal-catalog/early-stop-probes-v1/contact-sheet.png` (7,904,899 bytes; SHA-256
`328ee608462a770e19efedabcf6cb784e05888664f32c517306a17af757279b5`).

The bound review advances all three families with three production candidates each: Scrolls on
Plates at 100/300/400 ticks, Triangular Forms at 200/400/600 ticks, and Cups at 100/200/400 ticks.
Each selected variant has measured positive growth and remains below the web ceiling. These nine
candidate files still fill zero formal slots until their large scientific counterparts and final
catalog bindings are produced.

First dual-output production protocol (registered before implementation/launch, 2026-08-30):
generate exactly 24 distinct GG+ entries, three each for eight reviewed families, under
`out/named-crystal-catalog/direct-production-v1/`. Launch exactly 24 independent single-threaded
processes on the registered Intel Core Ultra 9 285K host, so the initial fleet uses all 24 physical
cores without duplicating a recipe. Each process must write the exact materialized spec, full final
state, final mesh, growth-event table, record, separate stdout/stderr, exit status, and a
`gutcheck-anim-v1` mesh timeline. Timeline cadence is `ceil(tick cap / 120)` with a floor of one
tick; the resulting manifest must contain approximately 120 frames, including seed and final-state
snapshots. Every completed web file must decode through the real browser decoder and be strictly
less than 20,000,000 bytes. The production report records actual worker count, exact argv, per-file
byte lengths and SHA-256 identities, frame count, and a recursive scientific-bundle inventory.

| Family | Variant IDs / values | One driver and source |
|---|---|---|
| Solid Columns | `rho-0p95`, `rho-1p00`, `rho-1p05` | multiply the reviewed baseline's `rho` by 0.95 / 1.00 / 1.05 |
| Sheaths | `rho-0p95`, `rho-1p00`, `rho-1p05` | multiply the reviewed baseline's `rho` by 0.95 / 1.00 / 1.05 |
| Split Plates & Stars | `rho-0p95`, `rho-1p00`, `rho-1p05` | multiply the reviewed baseline's `rho` by 0.95 / 1.00 / 1.05 |
| Isolated Bullets | `rho-0p95`, `rho-1p00`, `rho-1p05` | multiply the reviewed baseline's `rho` by 0.95 / 1.00 / 1.05 |
| Scrolls on Plates | stops 100 / 300 / 400 | exact reviewed early-stop candidates; stop tick is the only driver |
| Triangular Forms | stops 200 / 400 / 600 | exact reviewed early-stop candidates; stop tick is the only driver |
| Cups | stops 100 / 200 / 400 | exact reviewed early-stop candidates; stop tick is the only driver |
| Hollow Plates | cavity radii 1 / 2 / 4 | exact reviewed hard-form candidates; seed cavity radius is the only driver |

The stop-time and cavity-radius steps exceed 15% because their drivers are discrete and the bound
review selected those exact distinguishable forms; they are explicitly recorded exceptions to the
normal 5% starting step. The four `rho` families use the normal ±5% step and hold seed geometry,
domain, dimensions, tick cap, stopping rule, camera/extraction recipe, RNG seed, noise, and all
other G-G inputs fixed. The runner derives all 24 specs from tracked source manifests and verifies
the derived source/spec hashes against the tracked reviews; ignored probe files are not authority.

This tranche is production generation, not automatic type acceptance. After it completes, render
the registered type views, confirm each trio remains within its named type, verify the scientific
and web products, and only then fill those 24 catalog slots. A failed family stays pending and its
three large bundles remain measured generation output rather than accepted catalog entries.

Direct-production implementation checkpoint (2026-08-30):
`docs/named-snow-crystal-direct-production.json` pins the eight families, 24 lower/baseline/upper
jobs, source identities, one-driver values, frame-count interval, strict web ceiling, and 24-core
host contract. `scripts/named-crystal-direct-production.ts` derives every spec from the tracked
baseline/early-stop/hard-form plans, refuses review or hash drift, and builds one replay per job
that writes both output classes. Post-run verification decodes the web file through
`decodeGrowthAssetV1`, decodes the full checkpoint, cross-checks checkpoint/growth/frame endpoints
against the record, requires 100–122 complete scientific frames, hashes every payload file, and
writes a resumable per-job status plus fleet report. The read-only plan reports 24 pending jobs,
eight families, 24-process concurrency, and frame cadences from 1 to 50 ticks.

Product-sized pre-launch verification passed:

- `node scripts/named-crystal-direct-production.ts plan` — 24 pending jobs, eight families,
  registered concurrency and physical/logical counts 24/24
- `npx vitest run runner/test/named-crystal-direct-production.test.ts` — one file, five tests passed
- `npm run typecheck`
- `npm run lint:rule7`
- `git diff --check`

## Out of scope

- A riming, droplet, aggregation, thermal, or other new physical solver. `Rimed` and `Graupel` stay
  visible as intentionally excluded taxonomy rows.
- Claims that the G-G catalog predicts the natural Nakaya temperature/supersaturation diagram or
  that composed twins/rosettes are one physically simulated crystal.
- Replacing `GGThreshold`, deleting the CPU oracle, changing Libbrecht kinetics, reopening a phase
  gate, or treating an aesthetic type review as validation evidence.
- Serving or copying historic mixed/private reference images. The public catalog uses project-owned
  previews and source links/text only.
- Counting camera changes, color changes, duplicate files, or one primary animation assigned to
  multiple types as the requested three morphology variants.
- Pruning the current 52 web assets, 52 scientific bundles, or their NAS publication products.

## Tried and rejected

- **Generate three variants for one type before attempting the next type.** Rejected because it
  delays broad coverage and can consume long runs before hard or impossible fixed-lattice forms are
  discovered. Coverage-first passes expose the useful frontier sooner.
- **Treat every non-planar or multi-armed name as a request for a new solver.** Rejected for this
  visual catalog: explicit scene composition covers nine named visual forms without misdescribing
  them as one solver state.
- **Call scene transforms a G-G result.** Rejected because G-G evolves one lattice orientation.
  Composition gets its own format and label.
- **Count three camera paths over one crystal as three variants.** Rejected because the maker asked
  for shape variety from small parameter changes.
- **Trust existing labels or filenames as type acceptance.** Rejected because several current
  anchors are only related to the named class and axial structure is hidden in face-on previews.
- **Use a tiny scene manifest as the whole web-size measurement.** Rejected because playback also
  needs its unique component assets. The entry measurement includes those cold bytes.
- **Attempt rimed crystals or graupel procedurally and leave them unlabeled.** Rejected by maker
  scope and epistemic honesty. Both remain visible exclusions rather than counterfeit physics.
- **Add custom-seed controls directly to the permanent `GGSolver`.** Rejected after exact
  `npm test` exercised the frozen Phase 9 permanent-control identity: the two readiness tests failed
  because `solver-cpu/src/gg-solver.ts` changed from its recorded 35,382 bytes. Updating that hash
  would rewrite a completed scientific-control identity for a product feature. GG+ therefore lives
  in a separate adapter source, and the focused readiness test passes with the control restored
  byte-for-byte.
- **Duplicate the complete G-G evolution implementation into a second solver.** Rejected because
  two copies of diffusion/surface machinery could silently drift. The GG+ adapter calls the
  control's existing seed attachment and boundary rebuild path, then inherits all evolution methods;
  an exact parity regression makes that compatibility seam visible.

## Open questions

- The four GG+ probe types may expose a representational limit of the fixed lattice. A failed probe
  does not authorize new physics; it returns to the maker with the measured visual failure and the
  choice of an explicitly composed approximation or a visible unsupported row.
- Website-library integration occurs only after the format and representative payloads pass in this
  repository. Any separate-repository edits use their own branch and checks while preserving this
  manifest as the producer contract.

## Worktree registration

- Branch: `feature/named-crystal-catalog`
- Worktree: `C:/Users/HIL_ADMIN/Documents/GitHub/snowflake-named-catalog`
- Base at registration: `fix/animation-queue-windows-spawn` commit `0f81501`, which contains the
  completed growth tooling and the independently owned active scientific-bundle publisher.
- Isolation: the publisher continues only in
  `C:/Users/HIL_ADMIN/Documents/GitHub/snowflake-animation`; this worktree does not run, stop,
  register, or mutate that transaction or its `out/growth-scientific/` source.
- Removal condition: after the catalog implementation is merged and every useful ignored output is
  either published under its governed locator or explicitly retained elsewhere. Removal itself is
  not authorized by this plan.
