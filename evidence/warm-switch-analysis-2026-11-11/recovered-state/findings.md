# Recovered warm switch-state readout — November 11, 2026

The recovered full states add the missing per-cell fill information at the switch and after
one inactive update. They confirm that the central patch differs in both occupancy and fill,
and that width3's later stalled axial floor was already almost at its eventual fill value at
cutoff. It was not exactly frozen at cutoff.

All six recovery-verification receipts were present before the readout. For each state the
recipe checked the recorded solver-byte SHA-256, decoded the strict discovery codec and
called `LKSolver.restoreDiscovery`. It read arrays only: no relaxation, interface advance,
state mutation, checkpoint rewrite or counterfactual intervention occurred.

## Central patch at the actual cutoff

The patch is the fourteen fixed lattice sites with radius <=1 at z=-1 and +1, relative to
the seed center. C is the completed active update crossing the cutoff; C+1 is after one
whole inactive relaxation/growth update.

| Preparation | At C, patch occupied sites | At C, unattached fill range (-4.5 C / -5 C) |
|---|---:|---|
| Early1 width3 | 0/14 | .0943817-.102852 / .109558-.118083 |
| Early5 width3 | 0/14 | .575506-.623711 / .578454-.681885 |
| Early5 width4 | 14/14 | No unattached sites; attached f=1 |

Patch occupancy is unchanged at C+1 in all six rows. The width3/width4 fourteen-site
occupancy contrast independently agrees with the original event reconstruction. This alone
does not isolate whether geometry, fill or vapor caused the later outcome.

## The axial floor is nearly, but not exactly, at its later fill

Each pair of symmetry-related axis sites at z=+/-1 has these fill fractions:

| Temperature | At C | At C+1 | First later extent9 sample | Later minus C |
|---|---:|---:|---:|---:|
| -4.5 C | .5755063242444574 | .5755063306871173 | .5755068476213967 | 5.233769393431231e-7 |
| -5 C | .5784542757072474 | .5784542834151263 | .5784545733091957 | 2.976019483069692e-7 |

The later extent13 samples have exactly the same saved binary64 fills as extent9. Therefore
"the fill was already frozen at switch" would be false. The supported statement is that
nearly all of the eventual floor fill was accumulated before cutoff, with tiny later growth.
The first inactive update adds about 6.44e-9 / 7.71e-9 fill at those axis sites, while the
surrounding twelve sites of the same fixed patch add about .00272 / .00269 each. These are
same-cell, same-update increments within each recovered state, not deposited mass or an
intervention identifying a physical mechanism. The surrounding sites are defined by lattice
coordinates here, not silently assigned a facet/rim class.

## Field and recovery limits

`latticeCellSigma` is the saved lattice-cell supersaturation array, **not solved boundary
sigma_b**. It is cycle-boundary state, not a new relaxation solution on the post-update
geometry. Attached-cell field values are deliberately omitted as nonphysical. The later
boundary snapshot fields are separately labeled solvedBoundarySigma and are not subtracted
from checkpoint lattice values as though they were the same observable.

The fresh replay agrees with the original scientific event prefix under the parent recovery
checks. The original full switch fields were not retained, so no independent byte-for-byte
comparison to an original full-state checkpoint is possible. This is explicitly recovered
state from a verified replay, not a claim that the historical file was found.

## Reproduction and custody

From primary repository root:

```powershell
node out/warm-switch-state-readout-2026-11-11/readout.mjs
```

Optional arguments: replay root, output directory, original BLD rows root. The recipe uses
existing imports and works at the same depth under evidence/<bundle>/. Summary and source
hashes are in summary.json and inputs.json; actual replay checkpoint payloads remain in the
parent's replay collection. This lane wrote only its separate readout directory and launched
no simulation. Exit zero, empty stderr. Author is a shared-context Codex analysis lane; no
independent physical validation or full suite was performed by this lane.
