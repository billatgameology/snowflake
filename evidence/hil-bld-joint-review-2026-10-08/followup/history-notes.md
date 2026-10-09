# HIL saved-history and seed-growth increments

Internal, post-hoc model-development triage, 2026-10-08. The calculation is
[`history.mjs`](history.mjs); all inputs, exact physical-time brackets, alternate recorded
endpoints and outputs are in [`history.json`](history.json). No new simulation was executed.

The saved events distinguish inherited dimensions from subsequent growth. In the selected M1
cooling window, the difference in total axial span between the early and late switch cases is
entirely inherited: each adds the same two axial layers. In the M1 warming window, subsequent
axial increments also differ. Neither finding isolates geometry from partial fill or vapor
history, and neither establishes a physical mechanism or indefinite persistence.

## Method and scope

The discovery producer advances the surface and records the new attachments and geometry,
then applies an eligible temperature event at the completed-cycle boundary. Therefore the
attachments on the record carrying `timelineEvent` belong to the old environment. The analysis
includes them in the starting state and counts new attachments only from the next cycle onward.
This follows accepted ADR 0011 and `runner/src/post-phase10-discovery.ts`'s actual ordering.

Seed plus attachment coordinates reconstruct all 10,298 recorded cycles in the 16 history rows
and eight -8 C seed rows. Every event's occupancy count, largest lattice extent and Cartesian
aspect ratio agree exactly; final counts, times and cycles also agree. The 81,582 newly attached
sites reconcile with final occupancy minus seed occupancy. This is occupancy, not deposited mass.

For each direction/preparation triplet, the requested common duration is the shortest retained
duration after the actual event, divided into equal first/second halves. Measurements use the
last event at or before the requested time and retain the next event. Sensitivity combines those
recorded alternatives, with only the exact state used at an exact event time. These are discrete
endpoint sensitivity ranges, not continuous-time bounds. No interpolation or update-count
alignment is used. Starting size, shape and prehistory differ between switch extents.

Axial and lateral changes below are total center-span changes, not one-tip distances. Lateral
span is the larger Cartesian coordinate span. Aspect ratio uses the project's inclusive span
convention, which is different from center span and from the lattice-extent stopping condition.
The JSON also counts additions inside/outside the previous axial extent and integer hex-radius
envelope. Being inside that envelope does not imply an enclosed void or cavity.

## Environmental history: inherited dimensions and new growth

The three entries in each cell are switch extents 7 / 11 / 15. All rows use dx = 0.35 um.
`history[].rows[].windows.full` retains the exact readout and its sensitivity.

| Direction and preparation | Common post-event duration (s) | Initial axial layers | Added axial layers | Added lateral center span (um, at-or-before) | New attached sites |
|---|---:|---|---|---|---|
| -6 to -14.4 C, M1 | 3.4546535953 | 3 / 7 / 13 | 2 / 2 / 2 | 2.424871 / 1.868911 / 1.818653 | 478 / 868 / 1416 |
| -6 to -14.4 C, no-dip | 10.7548333196 | 1 / 5 / 7 | 12 / 8 / 8 | 3.081347 / 2.568911 / 2.056476 | 2032 / 2552 / 3198 |
| -14.4 to -6 C, M1 | 6.5968936062 | 1 / 3 / 3 | 10 / 6 / 6 | 2.424871 / 2.218911 / 2.056476 | 1002 / 1318 / 1746 |
| -14.4 to -6 C, no-dip | 9.3725770460 | 3 / 7 / 13 | 6 / 6 / 4 | 3.431347 / 2.568911 / 2.056476 | 1590 / 2370 / 2982 |

Every added-axial-layer entry in that table is unchanged by the recorded endpoint alternatives.
For M1 cooling at switch extent 11, the next event increases the lateral increment from
1.868911 to 2.424871 um and new sites from 868 to 934. The other full-window table entries
are unchanged by their recorded alternatives. Thus an ordering claim that the three M1 cooling
lateral increments are strictly decreasing would be too strong; early-versus-late remains distinct.

For the two M1 groups, the actual elapsed bracketing times are:

| Direction | Switch extent | At-or-before elapsed (s) | Next elapsed (s) |
|---|---:|---:|---:|
| Cooling | 7 | 3.4373767889 | 3.4644842923 |
| Cooling | 11 | 3.4257166146 | 3.4667210281 |
| Cooling | 15 | 3.4546535953 | exact terminal |
| Warming | 7 | 6.5716299022 | 6.6125110087 |
| Warming | 11 | 6.5883723512 | 6.6266636016 |
| Warming | 15 | 6.5968936062 | exact terminal |

M1 cooling begins with an early-to-late axial-layer gap of ten and ends this selected window
with the same gap. This statement is specifically about total axial span over this window;
its lateral increments and attachment counts differ. The timing of axial additions also differs:
in the second half the three rows add 0 / 0 / 2 axial layers, all unchanged by the bracket choices.

M1 warming adds 10 / 6 / 6 axial layers, or 3.5 / 2.1 / 2.1 um total span. The second half alone
adds 4 / 2 / 2 layers, also unchanged by the recorded alternatives. The early preparation therefore
continues to extend axially faster over that selected later half; the difference is not only an
old outline remaining visible. This is a finite comparison between differently sized and prepared
states, not an isolated effect of geometry and not an asymptotic growth-rate measurement.

The no-dip cases also change their incremental axial response with switch stage. These controls
make it inappropriate to equate all history dependence with the M1 dip factors.

## Matched recorded prefixes against static source-temperature controls

Each switched row is additionally compared with the static control at its original temperature,
starting at the same cycle and physical time as the switch. For all twelve rows, the complete
recorded prefix through and including the trigger cycle matches exactly in reconstructed state,
`relaxation`, `boundary`, `surface`, `attached`, `ledgers` and `simTimeSeconds`. These checks do not
compare unrecorded full vapor/fill fields or claim field-state equivalence. The unchanged control
does not undergo the temperature event.

Each pair uses its own shorter remaining time, so these pair durations differ from the triplet
window above and from one another. The following are switched-minus-static changes in growth:

| Direction and preparation | Pair duration for extents 7 / 11 / 15 (s) | Added axial-layer contrast | Added lateral-span contrast (um) |
|---|---|---|---|
| Cooling, M1 | 5.615318 / 4.161168 / 3.454654 | -4 / -2 / 0 | +2.212178 / +1.818653 / +0.812178 |
| Cooling, no-dip | 14.293742 / 11.572628 / 7.956494 | +4 / +4 / +2 | -0.700000 / -0.700000 / 0 |
| Warming, M1 | 5.331602 / 3.967351 / 2.377023 | +4 / +2 / 0 | -2.212178 / -1.818653 / -1.162178 |
| Warming, no-dip | 14.611019 / 13.964041 / 9.372577 | -4 / -4 / -2 | +0.700000 / +0.350000 / 0 |

All dimension contrasts in this table survive their recorded endpoint alternatives. The switch
changes subsequent dimensions relative to the same recorded preparation, and the direction depends
on the chosen parameter preparation. A later-switch zero axial contrast means zero over that
pair's retained window, not no effect in general; occupancy/lateral changes may still be present.

## The -8 C wide-seed sign reversal is axial catch-up while Cartesian spans plateau

At common quartet age 10.4447095459 s, the wide-seed both/neither arms have inclusive
axial/lateral spans 11/19 and 9/17. Their aspect-ratio difference is +0.049535604.
At the later common pair age 11.6872892349 s, they are 11/19 and 11/18, giving -0.032163743.
Both signs survive the recorded bracketing states.

Across that window the at-or-before observations give 302 new sites in the both arm while its
axial and largest Cartesian lateral spans stay fixed. The neither arm attaches 648 sites and adds two axial layers (0.70 um total)
and 0.35 um lateral center span. The neither arm has caught up in axial extent while remaining
narrower. That accounts geometrically for this sign reversal. It is not cessation of growth in
the both arm, nor evidence that a material transition temperature has been located. Recorded
endpoint alternatives give 278-302 versus 648-672 new sites; the span increments are unchanged.
The plateau applies to the named Cartesian spans, not the entire outline: the both arm still
adds sites beyond its former integer hex-radius envelope.

The JSON's four quartet-age fractions show the wide-seed both-minus-neither aspect-ratio contrast
at +0.200000, +0.148744, +0.095833 and +0.049536; all retain their signs under the recorded choices.
These are four selected observations, not a claim of monotonicity at every intervening event.

The tall seed is less clean: the at-or-before pair-age contrast is +0.101961, but the next neither
event changes its axial span from 17 to 19 layers, allowing -0.031373 instead. Its earlier quarter
and half-age contrasts also do not support a uniformly positive sign: the recorded ranges are
[-0.166800, 0] and [-0.144444, +0.077778]. The later three-quarter and quartet observations are
robustly positive. The endpoint tie alone discards this timing structure.

## Implication for the next decision

Longer observations should compare additions over named elapsed-time windows, not only total
aspect ratio. M1 warming's early/late pair is a useful candidate for persistence because its
incremental axial difference survives into the second half of the current window. M1 cooling
is a useful contrasting case: much of its axial separation is inherited over the selected full
window, although attachment counts, lateral extension and timing differ. The -8 C wide-seed
comparison needs enough later growth to distinguish recurring discrete catch-up from sustained
divergence; adding finely spaced temperatures would not resolve that distinction.

No longer-run target, grid, schedule or roster is selected here. Resolution and domain effects,
unequal starting sizes, coupled state history and the short retained time windows remain open.

Reproduce from a repository root, giving the two retained campaign roots and an absent output:

```powershell
node evidence/hil-bld-joint-review-2026-10-08/followup/history.mjs C:/Users/biao3/Documents/GitHub/snowflake/out/hil-retired-2026-10-08/discovery-resume/batch1-hil-resumable C:/Users/biao3/Documents/GitHub/snowflake/out/hil-retired-2026-10-08/hil-exploration-batch2/batch2-hil out/history-increments-rerun.json
```

The author is a Codex/GPT-6 analysis subagent with inherited context. This calculation independently
reconstructs the named event geometry and checks the recorded prefixes; it does not re-execute
solvers, inspect full checkpoint fields, perform an external scientific review or grant gate credit.
