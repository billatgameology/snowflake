# Plan — Phase 6 arm-3 sweep: `M1_NO_DIP_ABLATION` at measured-only grade

- **Phase:** Phase 6 — Validation against the Nakaya diagram
- **Status:** in progress
- **Started:** 2026-08-07
- **Last touched:** 2026-08-07 by Claude Fable 5

The decision-0045 addition: a 204-point measured-only sweep of the ablation arm, identical to
the executed arm-2 configuration in every registered respect except `paramSet`, so the three
arms are same-protocol comparable. Sub-unit A (the runnable parameter set) landed at `e913240`.

## Done when

The sweep completes 204/204 from a tracked-clean committed snapshot, its `points.json`,
`report.json`, and `diagram.svg` are promoted under `evidence/phase6-sweep-arm3/` with manifest
entries, an independent sibling verifier passes, and the artifact carries the measured-only
labels plus decision 0045's closure statement. One proportionate non-author review covers the
registration + artifact (this unit and the WP2 recon unit are separate engagements).

## Implementation map (from the 2026-08-07 read-only wiring survey; file:line as of `369e7f6`)

**Registration (all additive; never edit `phase6-protocol.ts` or `phase6-arm2-protocol.ts`):**

1. New module `runner/src/phase6-arm3-protocol.ts`, mirroring arm 2's shape
   (`phase6-arm2-protocol.ts:435-471`): same key order, `arm` → `"arm3-no-dip-ablation"` (id
   final spelling free), `paramSet` → `"M1_NO_DIP_ABLATION"`, same `parameterTableSha256`
   OMISSION (enforced style per `phase6-arm2.test.ts:84-96`), `freezeCommit` inside the gated
   hash, freeze list via named overrides of arm 1's list (like `phase6Arm2FreezeList`,
   `:415-421`). The arm-2 dip-specific keys (`m1BasalDipCentreC`, `m1PrismDipCentreC`,
   `sdakAnchors`, `bistableTemperaturesC`, `sourcingTiers`) describe dips this arm removes:
   replace with an `ablationIdentity` block registering the matched-pair claim (sigma0 =
   `sigma0BasalM2Broad`/`sigma0PrismM2Broad`, `A_basal = A_prism = 1`, only-kinetic-difference
   statement) — a named, recorded schema deviation.
2. Constants mirroring `phase6-arm2-protocol.ts:489,493,576,615,619`:
   `PHASE6_ARM3_VALUES_SHA256`, `PHASE6_ARM3_JUSTIFICATION_SHA256`,
   `PHASE6_ARM3_VALUES_REVISIONS`, `PHASE6_ARM3_PROTOCOL_SHA256` + revisions,
   `PHASE6_ARM3_FREEZE_COMMIT`/`_ID`/`_PARAM_SET`. Two-commit landing: the freeze content
   commits first; the 40-hex `freezeCommit` + final hashes land in the follow-up (the
   preflight requires ancestry: `phase6-sweep.ts:347-366`).
3. `runner/src/phase6-sweep.ts`: `PHASE6_ARM3` descriptor (own `outDirName:
   "phase6-sweep-arm3"`, `diagramLabel`) + entry in `PHASE6_ARM_VALUES_SHA256` (`:258-261` —
   omission fails preflight by name as "(UNREGISTERED ARM)").
4. `runner/src/main.ts`: subcommand `phase6-sweep-arm3` (dispatch `:1368-1372`, usage
   `:1375,1472-1473`).
5. New `runner/test/phase6-arm3.test.ts` mirroring arm 2's suite (`phase6-arm2.test.ts` —
   the ~22 pin groups listed at survey items 5-22, including: literal hash pin, revisions tail,
   descriptor/table agreement extended to all three ids, schema presence/absence with mutation
   guard, shared-rows `toBe` identity with arm 1, override/added-row id lists, no-prose-leak,
   pending-row refusal, `--param-set`-only command difference vs BOTH arms, distinct
   `outDirName` vs both, cross-arm flag catch, freeze-commit refusal, arm-1-untouched hashes).

**Execution (after registration lands + exact `npm test` green):**

- `node runner/src/main.ts phase6-sweep-arm3 12` from a tracked-clean committed snapshot
  (concurrency 12 recorded; per-point 3 h default budget stands — historical rows avg
  ~1,430 s at this configuration). Configuration is fully inherited from
  `PHASE6_CROSSPLATFORM_FIXTURE` (`phase6-crossplatform.ts:70-127`): 48³, dx 0.35, extent 21,
  `aggregate-hv-g1h1-v6`, monopole-matched, relaxTol 1e-9, divTol 1e-7, seed 1, noise 0,
  seedRadius 2/thickness 1 — the only arm-varying child token is `--param-set`
  (`phase6-sweep.ts:1007`; asserted style `phase6-arm2.test.ts:383-387`). Output lands in
  `out/phase6-sweep-arm3/` (gitignored), then promotes to `evidence/` per ADR 0038.
- Do NOT run while a Stage A timing row is in flight (CPU contention contaminates the probe);
  sequence after Stage A completes, or pause the probe at a row boundary.

**Publication:**

- Promote `points.json`/`report.json`/`diagram.svg` to `evidence/phase6-sweep-arm3/`; add each
  to `evidence/MANIFEST.json` with updated `fileCount`/`totalBytes`
  (`evidence-integrity.test.ts:62-63`); files must be git-tracked (`:93-100`); `evidence/**
  -text` already covers the subtree; add published hashes to the literal map
  (`evidence-integrity.test.ts:168-175`) if printed in reports.
- New independent sibling verifier `app/scripts/phase6-arm3-independent.mjs` (Rule 9: imports
  nothing from `runner/src`, transcribes constants literally, like
  `phase6-arm2-independent.mjs`).
- Conscious test updates: `phase6-independent-evidence-scripts.test.ts:26,92-102` (flip-census
  copies + pinned sentence) only if the census gains arm 3; `phase6-sweep.test.ts:101-172`
  gains arm-3 counts without touching existing pins; `progress-index.test.ts` phrase/date pins
  updated with the PROGRESS entry.
- Two-element arm tables in `app/scripts/*` (`phase6-flip-census.mjs:27-34,75,81`,
  `phase6-regenerate-report.mjs:38-41`, others per survey §6) extend only if actually used for
  arm 3; extending the regenerate script is prudent (arm 2's history shows why).
- `docs/education/**` stays frozen even where its prose becomes stale ("M1_NO_DIP_ABLATION
  planned; unfrozen") — post-Phase-6 reconciliation territory, recorded here so nobody
  "fixes" it.

## Labels

The report and PROGRESS entry state: measured-only grade; the registered
conservative-intersection headline not computed by decision 0045; numerical adequacy per the
ladder's published verdict; only the matched M1-versus-ablation pair supports an
implementation-level dip-factor contrast, never physical SDAK causality in nature.

## Out of scope

Any edit to arm-1/arm-2 manifests, hashes, or historical artifacts; the ladder (separate
plan); education; GPU; held-out.

## Tried and rejected

(Append as they occur.)
