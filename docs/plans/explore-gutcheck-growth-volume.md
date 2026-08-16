# Plan — Compact smooth 3D replay for the G-G gutcheck

- **Phase:** Maker-directed Journey/media exploration; not a charter phase gate
- **Status:** local implementation complete; governed NAS publication deferred
- **Started:** 2026-08-15
- **Last touched:** 2026-08-16 by OpenAI Codex

## Goal

Replace the Run B gutcheck viewer's multi-gigabyte sequence of independently extracted meshes with
one compact, prebaked growth asset that supports smooth forward/reverse playback, scrubbing, and a
free 3D camera on the web. Preserve the executed G-G cell-attachment order without changing solver
behavior, and state plainly that the continuous surface between discrete attachment events is a
visual interpolation, Evidence = unvalidated.

After the full Run B asset validates, add a measured comparison webpage that places the legacy
per-frame workflow and compact growth replay side by side. The page must distinguish network bytes,
decoded/runtime memory, generation cost, interaction capability, and what each representation does
or does not preserve; estimates must not be presented as Run B measurements.

This is a new media/replay experiment alongside the immutable 701-frame `gutcheck-anim-v1`
timeline. It does not start Phase 7, alter any phase gate or scientific result, edit the permanent
solver, or replace the recorded source artifacts before the new representation is measured and
accepted.

## Done when

There is no charter milestone for this exploration. This unit is done when:

- a versioned `gutcheck-growth-v1` baker records every initially attached cell and every later
  `GGSolver.lastAttached` cell exactly once with its solver tick, while retaining the complete run
  configuration, lattice embedding, crop, count, and source/provenance fields needed to replay it;
- a strict decoder independently rejects malformed, truncated, duplicate, out-of-range, or
  count-inconsistent assets and reconstructs the cropped arrival-time volume;
- the gutcheck viewer loads that one asset, exposes continuous play/pause/scrub controls and the
  existing free camera, and renders a spatially and temporally smoothed implicit surface without
  fetching or swapping the 701 mesh frames;
- a small deterministic smoke replay proves start/middle/end behavior, reverse scrubbing, resize,
  reduced-motion/manual control, error handling, and zero page errors in a real browser;
- the smoke record states asset bytes, decoded/GPU memory, observed frame behavior, exact command,
  source configuration, and the difference from the legacy mesh extractor;
- a skeptical non-author review checks the format, solver-observation boundary, renderer failure
  modes, claims, and destructive-path handling; every blocker is repaired; and
- exact `TMPDIR=/private/tmp npm test` passes before the code commit. Only after those checks may
  the roughly ten-hour deterministic Run B replay recorded in
  `docs/plans/explore-gg-realism-gutcheck.md` be launched to produce the full private asset;
- the full private asset independently passes count, tick, crop, endpoint, occupancy-hash, and
  source-identity checks before any comparison claims use its measurements; and
- a real-browser comparison page presents both approaches, plays the compact Run B replay, makes
  the unavailable/non-comparable measurements explicit, and passes visual, interaction, resize,
  reduced-motion, and error-state checks without loading the multi-gigabyte legacy sequence.

## Approach

The existing animation is 701 unrelated Surface Nets meshes at ticks 0 through 70,000. At plan
write time, those counts and the 9,986,535,068-byte raw sum were recomputed from the private NAS
artifact `out/gutcheck-gg-realism/large/anim-B/manifest.json` and its named frame files. Every
adjacent pair changes vertex and triangle count, so normal glTF morph targets and ordinary vertex
animation textures have no stable correspondence. The measured quantized total of 6.62 GB is
recorded in `docs/plans/explore-phase7-prep.md`; neither it nor the viewer's coded five-frame-per-
second default in `app/src/spike-gg-realism.ts` removes frame swapping.

Exploit the monotone fact that G-G attachment is terminal. During a deterministic replay, consume
the public read-only `lastAttached` list after every step. Write one sparse event stream containing
flat lattice index plus exact uint32 attachment tick; include the seed cells at tick zero. Accumulate
the final axial crop without scanning the full lattice every frame. The baker lives in `scripts/`
and consumes `GGSolver`; it does not change `core/`, `solver-cpu/`, `runner/`, checkpoints, or
evidence machinery.

The browser validates and expands the sparse records into a cropped exact uint32 attachment-tick
volume, reserving uint32 maximum for never attached and therefore capping v1 ticks at one less than
that sentinel. The crop retains empty padding on every face so texture-edge clamping cannot falsely
seal the surface. A WebGL2 R32UI 2D texture array and custom ray-marched iso-surface shader make
display time continuous, allow topology to split and branch, and retain orbit-camera control. The
array layout is deliberate: WebGL2 guarantees only a 256-sample minimum 3D texture edge, while its
guaranteed 2D edge and array-layer limits cover Run B's wide, shallow crop. Triangular-prism
interpolation uses the lattice-compatible simplicial decomposition; the CPU shadow's registered
60-degree rotation samples stayed below their stated tolerance, while GPU D6h error remains
unmeasured. Temporal and surface smoothing remain presentation operations. The old high-resolution
mesh may remain available as an optional paused hero view, but the growth mode itself must not
depend on legacy frame fetches.

The pinned Run B checkpoint reports 961,597 attached cells. A 2026-08-15 read-only stream of its
full `a` field measured tight axial bounds `[306,306,18]` through `[894,894,30]`; the registered
two-cell halo is therefore 593 × 593 × 17 = 5,978,033 samples and 23,912,132 nominal R32UI bytes,
versus the recorded 6.62 GB quantized sequence. The checkpoint measurement is named in
`docs/PROGRESS.md`; actual browser allocation and performance still require the smoke record.

## Steps

- [x] Inspect the current 701-frame manifest, raw and quantized mesh formats, viewer cache/playback,
      Run B dimensions, solver attachment observation, and existing scene/capture tooling.
- [x] Record this implementation plan and commit it before executable work.
- [x] Add the strict `gutcheck-growth-v1` codec and focused adversarial tests.
- [x] Add a deterministic baker/smoke command using `GGSolver.lastAttached`, with seed handling,
      crop accumulation, exact run identity, and atomic output publication.
- [x] Add a smooth `?growth=` viewer mode, arrival-volume reconstruction, quality tiers,
      playback/scrub controls, reduced-motion behavior, and an explicit MODEL/unvalidated label.
- [x] Produce the small smoke asset and run start/middle/end plus reverse-scrub browser checks.
- [x] Record measured smoke size/performance/limits in this plan and `docs/PROGRESS.md`.
- [x] Obtain one proportionate non-author review, repair blockers, and run exact
      `TMPDIR=/private/tmp npm test`.
- [x] Commit the reviewed implementation, then launch the full Run B bake only if the smoke result
      supports it; record its restart-only command, logs, output, digest, and next action.
- [x] Monitor the restart-only Run B bake to atomic publication, then independently decode and
      re-derive its identity, event count, tick range, crop, endpoints, occupancy digest, byte size,
      and elapsed runtime before any comparison uses it.
- [x] Add a side-by-side browser comparison of the legacy per-frame workflow and compact replay,
      using measured Run B values and clearly labeled unknown or non-transferable quantities.
- [x] Run real-browser visual/interaction checks plus the governing repository checks, obtain a
      proportionate non-author review, update `docs/PROGRESS.md`, and commit the comparison.
- [ ] Publish the finished comparison bundle only after the parallel NAS-governance workstream
      freezes a forward collection/receipt contract; do not recreate the retired top-level `out/`
      layout or execute the legacy-path publisher against `collections/**`.

## Implementation record

The first deterministic smoke bake used:

```text
node scripts/gutcheck-bake-growth.ts --preset plate --dims 20,20,12 --ticks 200 --out out/gutcheck-growth-smoke/growth.bin --domain hexPrism --seed 1 --noise 0 --padding 2 --progress 50 --expected-attached-count 61
```

It completed at tick 200 with 61 attached cells (19 seed plus 42 later events), a 2,588-byte
asset, full-lattice occupancy SHA-256
`840c2a6cc9f46ae8978137735d78f30995a132d1144d3b723ef7b87f6b080796`, and asset SHA-256
`28e9bb62f3c9d073adbe9b134790e568e99dc372476af2aa8416d2f22f0fc233`. The asset is disposable
workspace output, not evidence. Exact
`TMPDIR=/private/tmp npx vitest run runner/test/gutcheck-growth-baker.test.ts app/test/gutcheck-growth-format.test.ts`
passed 34/34 focused tests after the exact-R32UI/uint-playhead revision; `npm run typecheck` and
`npm run build --workspace app` passed. The
codec tests include a hand-authored wire fixture and fail-closed mutations; the baker test grows an
independent 20×20×12 solver trace and matches every decoded index/tick plus occupancy snapshots.

The final non-author browser run used:

```text
/Users/clipper/.nvm/versions/node/v24.19.0/bin/node /Users/clipper/github/snowflake-education-ch1-video/app/scripts/growth-capture.mjs --growth out/gutcheck-growth-smoke/growth.bin --out-dir out/gutcheck-growth-smoke/browser-r32-runb-probe-v6 --quality low --port 4330 --params probeVolume=593,593,17
```

Its 8,418-byte record at
`out/gutcheck-growth-smoke/browser-r32-runb-probe-v6/record.json` has SHA-256
`c9e3250179a10ce334a61a5e6c49f7f6bcfc90988ef62c34f63d5e51fbbed17b`. Chromium 149 over
ANGLE SwiftShader WebGL2 uploaded the measured 593×593×17 R32UI allocation (23,912,132 nominal
bytes). Start/middle/final raw images differed, the forward and reverse tick-167 PNG hashes were
identical, portrait proxy bounds remained inside clip space, reduced motion stopped requested
autoplay, real controls paused/rewound and completed the tick-200→display-204 visual tail, one
growth request and zero legacy mesh requests occurred, malformed bytes failed with a specific
codec error, and both valid pages retained ready/no-error state before the record published. The
two raw control-canvas PNGs are retained beside the record and their independently recomputed
SHA-256 values match its fields.

This probe expands only the allocation around the tiny 61-event smoke. Its timing and image
complexity are explicitly stamped **NON-TRANSFERABLE** to Run B in the record. It does not measure
hardware-GPU performance, full Run B occupancy, OOM/context-loss recovery, GPU D6h error, mobile or
cross-browser behavior, or accessibility. The non-author reviewer was OpenAI Codex, GPT-5 family,
with inherited developer/repository context; it independently executed the browser captures,
34/34 focused tests, app typecheck, Rule 7, and diff checks, edited no tracked files, and approved
the implementation with no remaining blocker/high code findings. Exact root `npm test` and the full
Run B bake were explicitly outside that review. After the repairs and PROGRESS compaction, exact
`TMPDIR=/private/tmp npm test` passed; it covered Rule 7, both TypeScript projects and the complete
Vitest suite. The docs-only status update after that run is covered by the focused progress-index,
Rule 7 and diff checks before commit. The full Run B bake remains below.

The v1 baker has no mid-run restore path: it retains events in memory and publishes only after the
70,000th tick and all endpoint/legacy checks pass. A terminated run therefore restarts from tick
zero. Adding resumability would require a separately versioned solver-state/event checkpoint, not
an undocumented append mode. The reviewed launch must write its complete asset to local APFS first;
only after hashing it will a no-clobber verified copy be published to the SMB NAS. This avoids
discovering unsupported hard-link publication on SMB after roughly ten hours of computation.

## Full Run B bake — complete and independently validated

The reviewed implementation committed as `44fd4b6`. Immediately before launch,
`detectNasMount()` resolved `/Volumes/snowcrystal/`; the 97,503-byte legacy manifest at the derived
share-relative path had SHA-256
`a06bf93000ab948cd72617649530bcf96d39dbcd01badb22d5617a1b73d17c4d`. One process (actual
concurrency 1) launched locally under the original Run B executable
`/Users/clipper/.nvm/versions/node/v24.13.1/bin/node` (V8 `13.6.233.17-node.40`) with:

```text
scripts/gutcheck-bake-growth.ts --preset plate --dims 1200,1200,48 --ticks 70000 --out out/gutcheck-growth-runB/gutcheck-growth-v1.bin --domain hexPrism --seed 1 --noise 0 --padding 2 --progress 100 --legacy-manifest /Volumes/snowcrystal/out/gutcheck-gg-realism/large/anim-B/manifest.json --expected-attached-count 961597 --expected-occupancy-sha256 9c98fe41e5ea2f6b2020063218b37255877548bdeb49dadf4235a4cf039cf9f7
```

`out/gutcheck-growth-runB/live.log` is stdout, `error.log` is stderr, and the wrapper writes
`exit-status` only when the process terminates. The first measured line in `live.log` was tick
100/70,000, 37 attached/events, elapsed 55.0 seconds; `error.log` was empty. Do not start a second
copy. On exit 0, decode and re-derive asset/count/tick/crop/endpoints before a no-clobber NAS copy;
on interruption or nonzero exit, preserve the logs and restart from tick zero only after diagnosis.
The maker requested the measured per-frame-versus-compact comparison webpage as the immediate
post-validation deliverable; it is deliberately gated on this run rather than populated from size
or performance estimates.

The wrapper exited zero after the tick-70,000 line. `out/gutcheck-growth-runB/live.log` records
36,348.1 solver seconds and one final completion line; `error.log` is empty. The atomic asset is
7,695,060 bytes with SHA-256
`475c1f7c227c45b005bfdb8691b1250599b405fa59902462110312a4f26ceb7d`.
A coordinator-side strict validation wrote
`out/checks/gutcheck-growth-runB-independent-validation.json` (618 bytes, SHA-256
`ba02326e943b6d6f6a535381d3b55ce6f1ca8eaf5fb38813a1701e7e137bc205`), and a separate
handwritten raw-byte parser wrote
`out/checks/gutcheck-growth-runB-independent-raw.json` (1,234 bytes, SHA-256
`53a50ce4a0e2617c09e124d2901569dbd233ee97f825091b7cf786dcac39ed42`). Together they confirmed
the 2,280-byte padded header and exact byte formula,
961,597 unique tick/index-ordered events over ticks 0 through 70,000, the canonical 19-site seed,
active-domain membership, 24 final-tick events, tight bounds `[306,306,18]` through
`[894,894,30]`, the padded 593 x 593 x 17 crop, and a reconstructed 69,120,000-byte full-lattice
occupancy SHA-256 of
`9c98fe41e5ea2f6b2020063218b37255877548bdeb49dadf4235a4cf039cf9f7`.
It also bound the clean `44fd4b6` source/runtime identity and embedded 701-frame manifest digest.
The comparison coordinator separately repeated strict decode, crop reconstruction, occupancy
derivation, terminal-log reconciliation, and manifest-byte verification after locating the same
manifest in its governed collection. The read-only process monitor observed liveness, milestones,
exit status, stderr and the published local file; it did not perform either validation. None of
these checks mutated the asset or NAS.

### Concurrent NAS-governance seam

While this restart-only bake was running, a separate active worktree physically moved the shared
NAS payloads from the legacy top-level `out/` mirror into governed `collections/**` roots. The new
marker is present and the Run B inputs remain readable, but that workstream's catalogue and reader
adaptations are not yet frozen or merged here. Consequently `detectNasMount()` now correctly fails
the old marker path, and the reviewed comparison publisher's fixed legacy destination is no longer
an authorized forward publication target.

The immediate webpage will therefore be produced as a **local verified candidate**. Its bounded
reader may recognize only the exact marker-backed `gutcheck-generated-public@2026-08-15` Run B
manifest locations in addition to the frozen legacy locations, while retaining every digest,
count, frame, and source hard lock. The real-browser capture must start Vite with no repository
config and fail any unfulfilled NAS request, so Chromium can consume only the six explicitly
verified local inputs. No alias, symlink, top-level `out/` recreation, arbitrary-root bypass, NAS
write, or hand-authored measurement record is permitted. Final NAS publication remains pending the
governance workstream's forward collection/receipt contract; that storage handoff does not prevent
the maker from reviewing the measured local webpage now.

### Post-launch decoder and observation hardening

A second adversarial review after launch found three seams in the reusable implementation, not in
the already running solver process: file-controlled seed radii could reach an expansion loop before
a closed-form size bound; the baker compared `lastAttached` event count but did not rebuild the
event-derived final occupancy; and the focused exact-tick test used `lastAttached` on both sides of
its comparison. The repair preflights seed fit and exact closed-form count before enumeration,
requires every event batch length to equal the solver attached-count delta, rebuilds the full binary
occupancy from serialized event indices and binds its digest to `solver.a` plus the optional expected
digest, and derives the test oracle solely from before/after `solver.a` differences.

Exact focused verification
`TMPDIR=/private/tmp npx vitest run app/test/gutcheck-growth-format.test.ts runner/test/gutcheck-growth-baker.test.ts`
passed 37/37. Its 377-byte console record is
`out/checks/gutcheck-growth-hardening-focused.log`, SHA-256
`11eb968783ab0f38b0c0fbde71e8fbee79c4ef60b6c909dd161381e187a9b554`.
The follow-up non-author reviewer was OpenAI Codex (GPT-5 family), with inherited/shared full
developer and repository context; it inspected the four-file patch and safe-arithmetic order,
event/solver binding, per-tick delta, and independent oracle, reran `git diff --check`, made no edits,
and found no remaining blocker/high issue. It did not run the browser, full suite, or the private
Run B replay.

The live Run B process loaded committed baker `44fd4b6` before this repair, so these in-process
checks govern future bakes rather than retroactively changing that process. The final comparison
builder and flagless publisher independently reconstruct event-derived occupancy from the finished
bytes and require the pinned Run B digest; that planned post-run validation remains mandatory before
acceptance or publication.

## Comparison implementation — local Run B candidate complete

While the deterministic bake runs, the comparison implementation was prepared without issuing a
final record. `scripts/gutcheck-build-growth-comparison.ts` reopens the compact asset, re-derives its
full-lattice occupancy digest, hard-locks the Run B solver and executable identity, validates every
one of the 701 raw and quantized legacy frames, derives retained runtime measurements, and verifies
three MP4 posters against freshly decoded frames. It resolves NAS inputs through share-relative
paths and publishes the strict `gutcheck-growth-comparison-v1` record atomically without clobbering.

The responsive page at `app/gutcheck-growth-comparison.html` contrasts the legacy per-frame
workflow with the compact interactive replay, distinguishes retained measurements from unavailable
quantities, verifies compact bytes and SHA-256 before decoding, and makes the smooth surface's
interpolated status explicit. Its browser harness includes normal, reduced-motion, malformed-record,
same-size payload mutation, truncated-asset, missing-asset, and no-WebGL lanes. The standalone-player
link visibly states that it leaves the comparison page's integrity check; the embedded player keeps
manual seeking available while explaining disabled playback under reduced-motion preferences.

Independent review found no blocker/high issue in the prebuild. Exact
`TMPDIR=/private/tmp npm test`, `npm run build --workspace app`, and `git diff --check` passed. Those
checks preceded the real Run B compact artifact and therefore did not validate it. Final measured
validation and browser evidence are recorded below.

The final post-review strict builder reopened and validated all 701 raw frames and all 701
quantized frames in the marker-backed governed collection, then atomically wrote
`out/gutcheck-growth-runB/comparison-record-v2.json` (3,002 bytes, SHA-256
`5488f738f3068e74cfdbc38e07c35c1a30e21fe73f891a22ab1e8d50399086f8`, timestamp
`2026-08-16T11:11:13.634Z`). The record derives
9,986,632,571 bytes for the raw sequence, 6,622,194,703 bytes for the quantized web sequence,
7,695,060 bytes for the compact asset, and an 861x rounded size comparison. It names the same
legacy-manifest and final-occupancy digests on both sides. The generation times are explicitly
separate observed executions rather than a controlled performance benchmark. Removing only
`recordedAt` makes v2 byte-identical to the first record, which remains preserved but superseded.
A concurrent strict builder reached atomic publication with the same inputs and correctly refused
to replace that already-existing first record; its 280-byte no-clobber log has SHA-256
`194503fa7776cbb46bc49469c138f40af0a64caf35d6132f50ef2d0fba9c170b`.

The accepted real-browser run is
`out/gutcheck-growth-runB/comparison-browser-v5/record.json` (48,961 bytes, SHA-256
`ea194edc23dd583d9591c5009449c96d45f515291664b1baf76f8d508a3f2cb1`). Chromium 149 over
ANGLE SwiftShader loaded one comparison record and one compact asset, fetched zero legacy manifests
and zero legacy meshes, and reported no page errors. Play, pause, hold, keyboard seek, exact
start/middle/final seek, reverse reconstruction, orbit, reduced-motion manual control, landscape
and portrait containment all passed. Its start, middle, final and orbit screenshots are distinct;
the reverse screenshot exactly matches the middle screenshot. Malformed record, truncated asset,
same-size payload mutation, missing asset and exercised WebGL2-context-null lanes each stayed
not-ready and displayed its full lane-specific error after browser whitespace normalization.

The closing code reviewer was OpenAI Codex (GPT-5 family), a non-author with inherited/shared full
developer, repository and conversation context. It found and then verified the repair of copied-
marker and foreign-host-relative-root bypasses: collection input now requires the exact marker, an
absolute configured root or host-native candidate, and matching realpath/device/inode identity. It
independently passed 84 focused decoder/baker/builder/publisher tests, both TypeScript projects,
Rule 7 over 1,014 files, the capture parser and diff checks, and returned no blocker/high finding.
It did not rerun Chromium, read the NAS, exercise Windows/SMB, repeat the 16.6 GB builder or restart
the bake.

The closing artifact/visual reviewer was OpenAI Codex (GPT-5 family), a non-author with inherited/
shared full developer and repository context. It independently rehashed the local record, compact
asset, three posters and eight screenshots; hand-parsed all events and occupancy; rederived request,
interaction, reduced-motion and five negative-control witnesses; and visually inspected every v5
image. An earlier pass rejected an unpinned exact frame-size literal and unsupported repetition
quantifier; both are absent from v5. Its final verdict had no blocker/high finding. The 390 x 844
portrait is a scrolled partial view whose legacy badge and transient MP4 crystal are clipped, a
minor capture/polish limit; document-width and compact-camera bounds pass. The reviewer did not
reopen the NAS MP4 or legacy sequences, rerun Chromium, query hardware GPU/VRAM/performance, or
establish production compression, real-mobile, cross-browser or accessibility behavior.

After all tracked source, test, claim and detector repairs, exact
`TMPDIR=/private/tmp npm test` passed 123/123 test files with 2,091 tests passed and 8 skipped in
405.62 seconds. Its 33,723-byte console record is
`out/checks/gutcheck-growth-final-npm-test-v3.log`, SHA-256
`8750759f51abe23f45e72dc1bac1424b7417c94f8330b4ae67a026a01bc67fe4`; the two-byte zero-exit
record has SHA-256 `9a271f2a916b0b6ee6cecb2426f0b3206ef074578be55d9bc94f6f3fe3ab86aa`.
The command includes the Rule 7 scan over 1,014 files, both TypeScript projects and the complete
Vitest suite.

## Retired-path comparison publisher — frozen historical prebuild, do not execute

The flagless `scripts/gutcheck-publish-growth-comparison.ts` defined the pre-relocation publication
boundary without touching the live bake or NAS. It accepts only the fixed comparison bundle roster,
requires the successful wrapper/log records, strictly decodes the compact asset, independently
re-derives its full-lattice occupancy digest from event indices, and reopens the referenced NAS MP4.
The capture record is not inherited as a producer verdict: the publisher re-derives acceptance from
raw request entries, displayed text and layout measurements, tick/seek/playback witnesses, screenshot
digests, reduced-motion observations, exact applied negative-control bytes, visible error body text,
and the exercised WebGL2 context-null witness.

Publication copies exclusive fresh files into a private directory on the detected share, requires
one hard link per staged/final file, reopens and hashes the source, staging, final canonical bundle,
and referenced MP4 around the final same-share rename, and never deletes a failed attempt. Any
pre-rename failure leaves the exact private staging path intact and reports it for diagnosis; any
post-rename failure preserves the canonical path. Node exposes no portable directory
`RENAME_NOREPLACE`, so the final canonical absence check and rename carry the explicit
no-concurrent-local-mutator boundary already stated in the publisher. No broader destructive-cleanup
boundary is accepted.

The frozen files and SHA-256 digests at review were
`app/scripts/growth-comparison-capture.mjs`
`a3c3f7f5289b31ddf26a9f04b07ff687fff977fdd2366dc67083da7f36cd7a74`,
`scripts/gutcheck-publish-growth-comparison.ts`
`f072f03cb3363d4a93368112d09589f85a9d18d938ed0934b254cd8195115fff`, and
`runner/test/gutcheck-growth-comparison-publisher.test.ts`
`56c52424201ce20113447e85d9a1e7abf02c29f5652601de85d5fd21d2315422`.
Exact `TMPDIR=/private/tmp npm test`, capture-script `node --check`, and `git diff --check` passed on
that frozen implementation.

The closing non-author, read-only review was OpenAI Codex (GPT-5 family), with inherited/shared full
developer and repository context. It independently reran the focused publisher test, `npm run
typecheck`, capture-script `node --check`, and `git diff --check`, matched the frozen hashes before
and after review, and found no remaining blocker/high issue. Its limits are explicit: it did not
rerun full `npm test`, execute the final Chromium capture or visually inspect real Run B screenshots,
touch the live bake or NAS, or exercise Windows/SMB. This closes only the publisher prebuild review;
the NAS governance workstream later retired its fixed top-level `out/` destination before this
publisher ran. It must not be executed, retargeted ad hoc, or treated as forward publication
authority. The local measured comparison is complete; governed NAS publication remains pending a
frozen catalogue/owner-manifest/receipt/fresh-restore contract and is deliberately not claimed here.

## Out of scope

- Modifying `GGSolver`, either permanent surface operator, checkpoint meaning, scientific
  specifications, the charter, ADRs, gate evidence, or executed Run B source records.
- Calling the smoothed implicit surface an exact replay of the old partial-boundary
  `b / ggThreshBeta` level set. Attached-cell timing is exact; the continuous shell is visual.
- Activating Phase 7, earning Phase 6/7 credit, or treating a browser performance result as a
  scientific result.
- Deleting the 701-frame timeline, its quantized derivative, or the existing MP4s.
- Assuming mobile performance, production hosting, CDN compression, or accessibility from a
  desktop smoke check. Each requires its own measured acceptance.
- Starting the full Run B replay before the format, renderer, smoke test, and review close.

## Tried and rejected

- **Treat the first two screenshot directories as accepted browser evidence.** Rejected because
  `comparison-browser-v1/` and `comparison-browser-v2/` contain partial images but no terminal pass
  record. The harness first called a serialized request URL as though it were a Playwright request,
  then assumed the malformed-record lane had rendered an iframe. Both defects were repaired; v3
  preceded the closing claim review, and v4 still named the superseded first record. Only v5 is
  accepted.
- **Accept generic error-page words as proof that the named failure was visible.** Rejected after
  adversarial review: a page containing only “comparison/replay/unavailable” could pass without
  displaying the scoped failure. Capture and independent verification now require the complete
  lane-specific error after normalizing only browser-collapsed whitespace; v5 reran every lane.
- **Trust a copied public marker or another host's mount syntax.** Rejected after closing review.
  The builder now binds collection inputs to the exact marker plus an absolute configured or
  host-native detected root and matches realpath/device/inode identity; adversarial tests execute
  both copied-marker and relative-root attempts.
- **Publish exact frame-size extrema or a repetition quantifier as UI literals.** Rejected after
  artifact review because neither claim was carried by the strict record. V5 removes both; it says
  only that later frames re-encode the crystal grown by then and that an uncached state needs a fetch
  and decode.
- **Finish the first closing full-suite process after a new blocker was found.** Rejected: it was
  deliberately interrupted before completion because its source tree no longer represented the
  accepted implementation. Its partial log is not evidence. The named v3 log above is the fresh
  complete v3 run after every source, test and record repair.
- **Run or retarget the pre-relocation NAS publisher.** Rejected because its fixed top-level
  `out/` destination was retired during the parallel governance migration, and it cannot create the
  required catalogue, owner manifest, publication receipt or fresh-restore evidence. Local output
  is retained until the governed forward publication command is frozen.
- **Direct glTF morph targets or an ordinary vertex-animation texture.** Rejected because all 700
  adjacent legacy frame pairs change topology and have no stable vertex/index correspondence.
- **Bundle the 701 meshes into one larger file.** Rejected because it changes request count, not
  the 6.62 GB quantized payload, decode cost, topology seam, or memory pressure.
- **Cross-fade adjacent transparent ice meshes as the primary result.** Rejected because it draws
  two million-triangle-class shells, ghosts silhouettes and internal transmission, and remains
  bandwidth-bound. It may be useful only as a temporary comparison control.
- **Reveal only the final mesh by a per-vertex birth value.** Rejected as the primary model because
  surfaces exposed early and buried later do not exist in the final exterior topology.
- **One full signed-distance volume per timeline frame.** Rejected because it recreates a 4D
  multi-gigabyte payload. The monotone arrival-time field is the compact representation.
- **Normalize Run B ticks into uint16 texture values.** Rejected after review because floor
  quantization could reveal a cell before its exact attachment tick and made the CPU shadow differ
  from the shader contract. Exact R32UI ticks cost 23,912,132 nominal bytes for the measured crop,
  still tiny relative to the legacy sequence, and reserve one explicit never-attached sentinel.
- **One transmissive prism instance per attached cell.** Retained only as a fallback diagnostic:
  roughly 962,000 instances expose internal faces and change the smooth Surface Nets aesthetic.

## Open questions

- Whether the first polished renderer should use ray-marched arrival time throughout, or switch to
  a recorded high-resolution hero mesh after playback pauses.
- Which measured desktop and mobile quality tiers are acceptable after the smoke run; do not set a
  production default from estimates.
- Whether a later generalized format should also carry an optional partial-boundary visual field.
  That field is not monotone under G-G freezing/melting and cannot be folded into attachment time
  without a separate representation.
