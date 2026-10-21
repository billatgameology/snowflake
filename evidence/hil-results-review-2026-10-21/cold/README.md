# Cold domain comparison — October 21, 2026

The prism-sensitive cold core/tip lead survives the registered N64-to-N96 domain
comparison at unchanged spacing. This strengthens a specific implementation lead;
it does not establish grid convergence, domain independence or a physical finding.
The maker has not yet accepted a Phase 10 portfolio conclusion.

## Result and limits

[summary.json](summary.json) binds eight checked target29 endpoints, 4,812 complete
updates and 96 saved field snapshots. Conditions are -14.4 C, fraction .10,
dx .35 um, seed radius2/thickness1, CFL .05, four facet preparations, and unchanged
v6 monopole-matched numerical source. Each N96 spec equals its N64 control except
ID and dimensions. [input-hashes.json](input-hashes.json) binds every consumed
spec/result/exit/event/snapshot file; exact producer commits are in the summary.

Core is the largest completely occupied central-plane integer hex ball; tip is the
furthest occupied hex radius; gap is tip minus core, in lattice-radius units.
An explicit membership calculation agrees with the complete ring census. At equal
elapsed physical times after entering each named tip plateau:

| Tip | Shortest shared plateau (s) | Sampled plateau fractions | Gap: neither / basal-only / prism-only / both, at both domains |
|---|---:|---|---|
| 8 | 1.6552427526993938 | 0, .25 | 1 / 1 / 2 / 2 |
| 8 | 1.6552427526993938 | .5, .75 | 0 / 0 / 2 / 2 |
| 9 | .8692804047754876 | 0, .25, .5, .75 | 1 / 1 / 2 / 2 |

Adjacent-event gap alternatives agree at these samples. These are samples, not a
claim that every state in either plateau is identical. At the tip8 midpoint, ring8
occupancies are 48/48/18/18 of48 at both domains. At the tip9 midpoint, ring9 is
48/36/12/12 of54 at N64, versus48/48/12/12 at N96. The gap ordering survives while
the basal-only ring count differs. Occupied-site quantities do not inherit exact
domain equivalence from the gap result.

The separate absolute-age window ends at13.09203065212253 s, the shortest terminal
age across all eight. At its quarter, half and three-quarter samples the gap vectors
are respectively1/1/2/2, 0/0/2/2 and0/0/3/3 in both domains. At its endpoint the
N64 vector is0/0/4/3 and the N96 vector is0/0/3/3. N64 prism-only has just reached
its target with tip14, whereas N96 prism-only remains tip13. Own-terminal gaps are
0/0/4/4 in both domains, at different ages. These differences rule out reporting
whole-trajectory equivalence or substituting endpoint shape for common-age growth.

All twelve common extent crossings5..27 were read, with boundary membership,
neighbor counts and prism classification reconstructed from occupancy. At crossing19
the prism-enabled central rings8/9 contain30/12 sites in both domains. Their six
central prism sites have mean boundary supersaturation, in prism-only/both order,
.0032041125232010943/.003197656282702749 at N64 and
.0031916734902628836/.003178430475933141 at N96; mean alphaHKBoundary is
.6060215204899385/.6054090076199409 and
.6048397551855781/.6035740056971114, respectively. This is a saved-field
description at matched extent, not matched age or a fixed-geometry causal test.
At crossing17 both prism-enabled rows have zero qualifying prism cells at both
domains; null field statistics mean absent qualifying cells, not zero transport.
All ring/plane field profiles remain in the bound bulk derived readout.

## Interpretation and next discriminating options

This closes the named domain-sensitivity check on the strongest -14.4 C lead. It
adds to the earlier timestep evidence but leaves the one-cell lattice representation
and state-dependent attachment law unresolved. The -20 C window sensitivity from
the October18 review remains a separate limitation; these new rows do not amend it.

1. Prefer a physically matched spacing refinement of a minimal prism-only/neither
   pair if the next decision is whether this lead survives representation changes.
   A new protocol must specify the same physical seed, domain and comparison size;
   changing N alone repeats the check just completed. Costs are not yet transferable.
2. If the next decision is mechanism attribution, define a bounded shared-geometry
   intervention/readout separating the attachment response from inherited shape.
   Existing crossing fields can nominate states but cannot supply that counterfactual.
   Do not launch another unregistered broad sweep merely to collect similar shapes.

Neither option is approved or launched here. Author's skeptical pass: the strongest
supported statement is the named gap ordering at the registered samples. Ring counts,
times and terminal occupancy differ, and no natural causal claim follows from facet
switches in this implementation.

## Reproduce and recover

From a repository checkout containing these recipes and locked dependencies, use
Node24 and an **absent** output filename. Defaults point to the observed HIL paths.
Optional arguments are campaign roots containing `rows/`, not the rows directory:

```powershell
node evidence/hil-results-review-2026-10-21/cold/readout.mjs out/replay/cold.json C:/restore/oct10/out/hil-exploration-oct10 C:/restore/oct19/out/hil-domain-seed-oct19
node evidence/hil-results-review-2026-10-21/cold/summarize.mjs out/replay/cold.json out/replay/cold-summary
```

Use the root preservation receipt/catalogue to restore those two campaign trees;
replace the example prefixes with the fresh restored paths. The recipe performs
the existing endpoint check, reconstructs saved events, and verifies source parity
between the named producer commits. Restoring raw bytes does not launch a solver.
Summary timestamps and local path strings may differ on replay; scientific values
and consumed raw hashes are the comparison, not a byte-identical derived JSON claim.

Executed final command used output
`out/analysis-2026-10-21/cold/readout-final.json` and explicit original campaign roots
under `C:/Users/biao3/.codex/worktrees/{hil-exploration-oct10,hil-domain-seed-oct19}/snowflake/out/`.
It exited0; logs are the same directory's `readout-final.stdout.log` and
`readout-final.stderr.log`. The final derived digest is
`41f386f5d0c40bc454e8b3987784a55b779af827c72c4e23a88244d480404804`.

`readout.mjs` copies October18 `stateMeasure`, `bracket`, `spatial` and `stats`
unchanged. New logic selects the registered eight rows, joint stages/ages and
packages results; `summarize.mjs` selects existing output fields. This remains
executable scientific readout logic under Rule6; the task-level verification
receipt owns the exact full-suite result. This note itself does not claim suite green.
Codex/GPT-6 shared-context subagent authored and executed this readout, with an
internal skeptical pass; no independent gate review or fresh physical validation
was performed. Raw producers were read-only and no simulation was started.
