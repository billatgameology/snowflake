# Warm switch mechanism and state recovery — November 11

The recording plan omitted immutable transition-state retention. Rolling current/previous
checkpoints supported restart, while extent samples and events supported the registered outcome
comparisons. They did not preserve the old switch-time full fields for mechanism analysis.
The maker's criticism is accepted; the future capture rule is now in AGENTS and the
[growth-dynamics plan](../../docs/plans/hil-bld-growth-dynamics-oct21.md#switch-state-analysis-and-bounded-recovery--november-11).

## What the saved observations already show

At both -4.5 and -5 C, the early-1 intervention ends before any site attaches: binary geometry
is still the 19-site seed, although partial fill and vapor have evolved. At the early-5 cutoff,
width 3 has 109 occupied sites and a .35 um opening; width 4 has 123 sites and no positive-depth
opening, despite identical overall axial/lateral spans. Width 4's additional 14 sites are two
seven-site central patches at z=-1 and +1. They attach around 2.3-2.5 s, before the cutoff.
The contrast survives a post-hoc common-age observation at 5.05 s and its adjacent-event
alternatives at both temperatures. The parent independently reproduced these coordinate sets
without the cavity helper: [receipt](independent-patches.json), [recipe](independent-patches.py).

This localizes the question: early filling of the center versus leaving it open is associated
with different later growth patterns. Width 4 receives more selected kinetic demand, so a
simple total-demand explanation is insufficient. Later spatial snapshots show very small
solved boundary vapor and attachment values on width 3's unfilled axis floor, while width 4's
axis front advances. The states/times differ; this is not proof of a geometry-only cause or
physical zero uptake. [Detailed findings](findings.md) and [summary](summary.json) retain exact
values, timestamps, units, experimental scope and event-versus-boundary timing.

## Recovery and recurrence prevention

**Recovery completed:** all six processes exited zero, all 589 scientific updates matched
original BLD prefixes excluding RSS, all common boundary snapshots matched, and all twelve
full-state checkpoints passed digest/decode/tick checks. [Recovery receipt](recovery.json)
retains source/runtime, exact commands, both generations and full-array hashes.

The [recovered-state readout](recovered-state/summary.json) confirms that width 3's fourteen
central sites remain unattached at the switch, whereas width 4's are attached with fill one.
Width 3 axis fill is .5755063242444574 at -4.5 C and .5784542757072474 at -5 C at the switch;
the later saved floor exceeds those values by only 5.233769393431231e-7 and
2.976019483069692e-7 respectively. Thus almost all of the later sampled floor fill is
already present at cutoff; subsequent growth is concentrated elsewhere. These are fill
fractions, not flux measurements or a proof that the floor can never attach. During the
first inactive update, each axis-floor cell gains only about 6.44e-9/7.71e-9 fill at
-4.5/-5 C, while each of the surrounding twelve patch cells gains .00272/.00269.
This directly resolves local placement hidden by the aggregate diagnostics; it does not
identify geometry alone as its cause. See [recovered-state findings](recovered-state/findings.md).


The bounded replay uses six original coarse row specifications on HIL from the seed, through
only the first update after each switch: 589 updates total. This is not a cross-host resume,
changed-target continuation or rerun of the long fine-grid endpoints. No numerical operator,
checkpoint format, row control or scientific stopping target changed.

For each row, retain checkpoint C (completed cutoff-crossing update, before the first inactive
relaxation) and C+1 (after the first inactive coupled update). Both contain full occupancy,
fill and supersaturation plus the remaining evolution state. Neither is a freshly solved
post-switch/pre-fill boundary snapshot. The exact [worker recipe](replay-worker.mjs) checks
unchanged numerical source, runtime, every scientific event in the original prefix except
operational RSS, any common boundary snapshots, both checkpoint digests/codecs and array hashes.
Original full switch-state bytes are missing: label the recovered states as new replays
consistent with the original event prefixes, not independently verified original full fields.

Future transition campaigns must register named before/after full-state captures, keep those
outside rolling restart rotation, and exercise capture on the existing short witness before
multi-day compute. The existing codec is sufficient; no new scheduler or recording framework
is needed. Full per-cycle history is not required for every long run.

The [preservation plan](../../docs/plans/warm-switch-recovery-preservation.md) records completed
NAS publication and fresh recovery: collection `warm-switch-recovery@2026-11-11`, 103 files /
56,351,044 bytes, at `collections/warm-switch-recovery/2026-11-11/payload/` (currently `Z:/`).
All publication and fresh-restore file hashes match. Parent additionally ran the array readout
on restored payloads and reproduced all six numerical rows/twelve states, excluding relocated
paths only ([receipt](restored-readout-check.json)). Keep all originals.
This recovery does not claim preservation of the separate long HIL campaign, which remains
pending under its existing plan.

## Next discriminating action

Use the recovered states to examine central fill and vapor differences at the actual switch,
then register a specific prediction about the earlier central-patch filling sequence. Capturing
near those 2.3-2.5 s attachments may be more informative than extending endpoint sizes. A
controlled state-component intervention still needs its own scientific contract; the current
correlations do not isolate geometry, fill or vapor as the sole carrier of memory.

The analysis lane used inherited/shared context and existing reconstruction definitions; parent
performed the direct coordinate-set check. No external physical validation or novelty assessment
was executed. Verification and completed recovery/preservation receipts are recorded separately.


Reproduce the restored-state array readout from the repository root:

```powershell
node evidence/warm-switch-analysis-2026-11-11/recovered-state-readout.mjs <fresh-restore>/replays out/recovered-switch-readout <restored-BLD-campaign>/rows
```

This portable recipe maps preserved generation names into the supplied fresh-restore root,
then checks the original recorded payload hashes. It reads the restored payload, not an old
absolute workstation path. The original executed lane recipe identity remains in the summary;
the path-only adaptation changes no scientific calculation.

[Verification](verification.json): all six replays and 589 event updates matched, all twelve
states decoded, NAS and fresh restores matched, and restored-state readout matched. Exact
`npm test` on unchanged numerical/library source passed 247 files / 3102 tests, 23 skipped;
the final evidence/progress/catalogue checks passed all 27 tests. No scientific gate was run.
