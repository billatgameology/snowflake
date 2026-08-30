# Plan — named snow-crystal animation catalog

- **Phase:** Pre-Phase 7 product/catalog work; no charter phase or scientific gate is reopened
- **Status:** in progress — strict taxonomy manifest and generated text table complete; current-asset audit next
- **Started:** 2026-08-29
- **Last touched:** 2026-08-29 by OpenAI Codex (GPT-5)

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

Replace the runner's current radius/thickness-only seed description with a versioned discriminated
seed specification that retains the existing hexagonal-prism case and adds deterministic procedural
or exact-site seeds. Validate bounds, integer lattice coordinates, duplicates, active-domain
membership, and connectedness for single-crystal GG runs. Pin the generator version plus the exact
sorted-site digest in every recipe and bundle. Intentional asymmetric seeds do not claim D6h
symmetry; existing symmetric seeds retain their exact behavior and tests.

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
- [ ] Import and visually audit the existing 52-item candidate pool without counting labels alone;
      record accepted/near/missing by exact asset identity.
- [ ] Specify and implement versioned deterministic custom seeds while leaving the G-G update rule
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

The current-candidate links are an intake aid only. The 52-item visual audit has not run, so no
candidate fills an accepted variant slot yet and no growth process has started.

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
