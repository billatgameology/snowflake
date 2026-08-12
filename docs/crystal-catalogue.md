# Crystal catalogue — every generated crystal and its parameters

Generated 2026-08-12 from `out/gutcheck-gg-realism/gen/*-record.json`
(the git-tracked provenance records; regenerate with the script noted in docs/nas-ledger.md).
θ notation: value on the in-plane attachment slots. All runs hexPrism domain, seed 1, noise 0.
Meshes and growth timelines live on the NAS (see docs/nas-ledger.md); stills and viewers on
the site index.

## theta-rho grid (32)

Single stage. θ = attachment threshold on the in-plane slots (10/11/20) — low θ grows branches, high θ grows plates; slots 21/30/31 stay at 1 and vertical slot 01 at 3.5 throughout the whole catalogue. ρ = ambient vapor density (supersaturation). κ 0.005, μ 0.001, φ 0.01 fixed.

| id | recipe | ρ | κ | μ | dims | stopped | switches fired | kverts | h |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| sweep-t1-r0p08 | θ1 | 0.08 | 0.005 | 0.001 | 500×500×96 | domain-contact t14308 | — | 226 | 5.8 |
| sweep-t1-r0p1 | θ1 | 0.1 | 0.005 | 0.001 | 500×500×96 | domain-contact t9275 | — | 254 | 3.8 |
| sweep-t1-r0p12 | θ1 | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t6402 | — | 284 | 2.6 |
| sweep-t1-r0p16 | θ1 | 0.16 | 0.005 | 0.001 | 500×500×96 | domain-contact t3617 | — | 382 | 1.5 |
| sweep-t1p15-r0p08 | θ1.15 | 0.08 | 0.005 | 0.001 | 500×500×96 | domain-contact t20381 | — | 257 | 8.4 |
| sweep-t1p15-r0p1 | θ1.15 | 0.1 | 0.005 | 0.001 | 500×500×96 | domain-contact t13504 | — | 292 | 5.7 |
| sweep-t1p15-r0p12 | θ1.15 | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t9334 | — | 310 | 3.9 |
| sweep-t1p15-r0p16 | θ1.15 | 0.16 | 0.005 | 0.001 | 500×500×96 | domain-contact t5071 | — | 367 | 2.1 |
| sweep-t1p3-r0p08 | θ1.3 | 0.08 | 0.005 | 0.001 | 500×500×96 | domain-contact t28195 | — | 265 | 11.8 |
| sweep-t1p3-r0p1 | θ1.3 | 0.1 | 0.005 | 0.001 | 500×500×96 | domain-contact t18880 | — | 280 | 8.1 |
| sweep-t1p3-r0p12 | θ1.3 | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t13292 | — | 291 | 5.7 |
| sweep-t1p3-r0p16 | θ1.3 | 0.16 | 0.005 | 0.001 | 500×500×96 | domain-contact t7173 | — | 342 | 3.2 |
| sweep-t1p5-r0p08 | θ1.5 | 0.08 | 0.005 | 0.001 | 500×500×96 | tick-cap t30000 | — | 176 | 12.4 |
| sweep-t1p5-r0p1 | θ1.5 | 0.1 | 0.005 | 0.001 | 500×500×96 | domain-contact t28074 | — | 314 | 11.8 |
| sweep-t1p5-r0p12 | θ1.5 | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t20014 | — | 329 | 8.4 |
| sweep-t1p5-r0p16 | θ1.5 | 0.16 | 0.005 | 0.001 | 500×500×96 | domain-contact t11006 | — | 359 | 4.7 |
| sweep-t1p75-r0p08 | θ1.75 | 0.08 | 0.005 | 0.001 | 500×500×96 | tick-cap t30000 | — | 105 | 12.6 |
| sweep-t1p75-r0p1 | θ1.75 | 0.1 | 0.005 | 0.001 | 500×500×96 | tick-cap t30000 | — | 213 | 12.6 |
| sweep-t1p75-r0p12 | θ1.75 | 0.12 | 0.005 | 0.001 | 500×500×96 | tick-cap t30000 | — | 374 | 12.5 |
| sweep-t1p75-r0p16 | θ1.75 | 0.16 | 0.005 | 0.001 | 500×500×96 | domain-contact t17057 | — | 429 | 7.2 |
| sweep-t2-r0p08 | θ2 | 0.08 | 0.005 | 0.001 | 500×500×96 | tick-cap t30000 | — | 72 | 12.4 |
| sweep-t2-r0p1 | θ2 | 0.1 | 0.005 | 0.001 | 500×500×96 | tick-cap t30000 | — | 145 | 12.1 |
| sweep-t2-r0p12 | θ2 | 0.12 | 0.005 | 0.001 | 500×500×96 | tick-cap t30000 | — | 245 | 12.1 |
| sweep-t2-r0p16 | θ2 | 0.16 | 0.005 | 0.001 | 500×500×96 | domain-contact t24771 | — | 494 | 10.2 |
| sweep-t2p5-r0p08 | θ2.5 | 0.08 | 0.005 | 0.001 | 500×500×96 | tick-cap t30000 | — | 46 | 11.2 |
| sweep-t2p5-r0p1 | θ2.5 | 0.1 | 0.005 | 0.001 | 500×500×96 | tick-cap t30000 | — | 88 | 10.5 |
| sweep-t2p5-r0p12 | θ2.5 | 0.12 | 0.005 | 0.001 | 500×500×96 | tick-cap t30000 | — | 218 | 9.8 |
| sweep-t2p5-r0p16 | θ2.5 | 0.16 | 0.005 | 0.001 | 500×500×96 | domain-contact t20017 | — | 429 | 7.0 |
| sweep-t3-r0p08 | θ3 | 0.08 | 0.005 | 0.001 | 500×500×96 | tick-cap t30000 | — | 38 | 8.5 |
| sweep-t3-r0p1 | θ3 | 0.1 | 0.005 | 0.001 | 500×500×96 | tick-cap t30000 | — | 90 | 8.2 |
| sweep-t3-r0p12 | θ3 | 0.12 | 0.005 | 0.001 | 500×500×96 | tick-cap t30000 | — | 207 | 6.8 |
| sweep-t3-r0p16 | θ3 | 0.16 | 0.005 | 0.001 | 500×500×96 | domain-contact t21327 | — | 447 | 5.7 |

## kappa-mu grid (18)

Single stage at ρ 0.12: κ (boundary freezing fraction) × μ (melt rate) varied per θ. Higher κ thickens/fills; higher μ erodes and sharpens.

| id | recipe | ρ | κ | μ | dims | stopped | switches fired | kverts | h |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| sweep-t1p15-k0p001-m0p001 | θ1.15 | 0.12 | 0.001 | 0.001 | 500×500×96 | domain-contact t9289 | — | 313 | 3.8 |
| sweep-t1p15-k0p001-m0p006 | θ1.15 | 0.12 | 0.001 | 0.006 | 500×500×96 | domain-contact t10109 | — | 198 | 4.2 |
| sweep-t1p15-k0p02-m0p001 | θ1.15 | 0.12 | 0.02 | 0.001 | 500×500×96 | domain-contact t9487 | — | 307 | 3.9 |
| sweep-t1p15-k0p02-m0p006 | θ1.15 | 0.12 | 0.02 | 0.006 | 500×500×96 | domain-contact t10333 | — | 200 | 4.2 |
| sweep-t1p15-k0p1-m0p001 | θ1.15 | 0.12 | 0.1 | 0.001 | 500×500×96 | domain-contact t10402 | — | 318 | 4.4 |
| sweep-t1p15-k0p1-m0p006 | θ1.15 | 0.12 | 0.1 | 0.006 | 500×500×96 | domain-contact t11441 | — | 194 | 5.0 |
| sweep-t1p75-k0p001-m0p001 | θ1.75 | 0.12 | 0.001 | 0.001 | 500×500×96 | domain-contact t29839 | — | 393 | 12.5 |
| sweep-t1p75-k0p001-m0p006 | θ1.75 | 0.12 | 0.001 | 0.006 | 500×500×96 | tick-cap t30000 | — | 155 | 12.7 |
| sweep-t1p75-k0p02-m0p001 | θ1.75 | 0.12 | 0.02 | 0.001 | 500×500×96 | tick-cap t30000 | — | 379 | 12.8 |
| sweep-t1p75-k0p02-m0p006 | θ1.75 | 0.12 | 0.02 | 0.006 | 500×500×96 | tick-cap t30000 | — | 156 | 12.3 |
| sweep-t1p75-k0p1-m0p001 | θ1.75 | 0.12 | 0.1 | 0.001 | 500×500×96 | tick-cap t30000 | — | 328 | 12.8 |
| sweep-t1p75-k0p1-m0p006 | θ1.75 | 0.12 | 0.1 | 0.006 | 500×500×96 | tick-cap t30000 | — | 133 | 12.3 |
| sweep-t2p5-k0p001-m0p001 | θ2.5 | 0.12 | 0.001 | 0.001 | 500×500×96 | tick-cap t30000 | — | 218 | 12.1 |
| sweep-t2p5-k0p001-m0p006 | θ2.5 | 0.12 | 0.001 | 0.006 | 500×500×96 | tick-cap t30000 | — | 61 | 12.0 |
| sweep-t2p5-k0p02-m0p001 | θ2.5 | 0.12 | 0.02 | 0.001 | 500×500×96 | tick-cap t30000 | — | 227 | 12.1 |
| sweep-t2p5-k0p02-m0p006 | θ2.5 | 0.12 | 0.02 | 0.006 | 500×500×96 | tick-cap t30000 | — | 60 | 11.8 |
| sweep-t2p5-k0p1-m0p001 | θ2.5 | 0.12 | 0.1 | 0.001 | 500×500×96 | tick-cap t30000 | — | 213 | 12.0 |
| sweep-t2p5-k0p1-m0p006 | θ2.5 | 0.12 | 0.1 | 0.006 | 500×500×96 | tick-cap t30000 | — | 54 | 11.6 |

## sharp tips (4)

Single stage at ρ 0.12 with μ raised to 0.006 on the tip slots (10/20) — the 'sharpened tips' variant of θ=1/1.15/1.3/1.5.

| id | recipe | ρ | κ | μ | dims | stopped | switches fired | kverts | h |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| sweep-t1-sharp | θ1·sharp | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t7438 | — | 343 | 3.1 |
| sweep-t1p15-sharp | θ1.15·sharp | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t12092 | — | 346 | 5.2 |
| sweep-t1p3-sharp | θ1.3·sharp | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t18911 | — | 358 | 8.0 |
| sweep-t1p5-sharp | θ1.5·sharp | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t29944 | — | 363 | 12.8 |

## two-stage (26)

Environment switch mid-growth (§XII events): branch-first (θ low→high: arms grow, then plate over) or plate-first (θ high→low: hex plate core, then arms erupt). Switch tick in the id; 'fired' says whether the run reached it.

| id | recipe | ρ | κ | μ | dims | stopped | switches fired | kverts | h |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| staged-branch1-to-plate3-at12000 | θ1·sharp→(t12000) θ3 | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t7438 | 0/1 | 343 | 5.9 |
| staged-branch1-to-plate3-at3000 | θ1·sharp→(t3000) θ3 | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t28876 | 1/1 | 472 | 17.5 |
| staged-branch1-to-plate3-at4000 | θ1·sharp→(t4000) θ3 | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t26906 | 1/1 | 679 | 17.0 |
| staged-branch1-to-plate3-at6000 | θ1·sharp→(t6000) θ3 | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t16537 | 1/1 | 501 | 10.4 |
| staged-branch1-to-plate3-at8000 | θ1·sharp→(t8000) θ3 | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t7438 | 0/1 | 343 | 5.8 |
| staged-branch1p15-to-plate2p25-at3000 | θ1.15·sharp→(t3000) θ2.25 | 0.12 | 0.005 | 0.001 | 500×500×96 | tick-cap t30000 | 1/1 | 403 | 18.1 |
| staged-branch1p15-to-plate2p25-at4000 | θ1.15·sharp→(t4000) θ2.25 | 0.12 | 0.005 | 0.001 | 500×500×96 | tick-cap t30000 | 1/1 | 469 | 18.0 |
| staged-branch1p15-to-plate2p25-at6000 | θ1.15·sharp→(t6000) θ2.25 | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t24800 | 1/1 | 535 | 15.6 |
| staged-branch1p3-to-plate2p6-at3000 | θ1.3·sharp→(t3000) θ2.6 | 0.12 | 0.005 | 0.001 | 500×500×96 | tick-cap t30000 | 1/1 | 294 | 17.8 |
| staged-branch1p3-to-plate2p6-at4000 | θ1.3·sharp→(t4000) θ2.6 | 0.12 | 0.005 | 0.001 | 500×500×96 | tick-cap t30000 | 1/1 | 314 | 18.0 |
| staged-branch1p3-to-plate2p6-at6000 | θ1.3·sharp→(t6000) θ2.6 | 0.12 | 0.005 | 0.001 | 500×500×96 | tick-cap t30000 | 1/1 | 403 | 18.1 |
| staged-plate2p25-to-branch1p15-at12000 | θ2.25→(t12000) θ1.15·sharp | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t23689 | 1/1 | 282 | 14.3 |
| staged-plate2p25-to-branch1p15-at3000 | θ2.25→(t3000) θ1.15·sharp | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t15842 | 1/1 | 397 | 9.6 |
| staged-plate2p25-to-branch1p15-at4000 | θ2.25→(t4000) θ1.15·sharp | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t18249 | 1/1 | 404 | 11.2 |
| staged-plate2p25-to-branch1p15-at6000 | θ2.25→(t6000) θ1.15·sharp | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t19659 | 1/1 | 431 | 11.9 |
| staged-plate2p25-to-branch1p15-at8000 | θ2.25→(t8000) θ1.15·sharp | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t21311 | 1/1 | 345 | 11.2 |
| staged-plate2p6-to-branch1p3-at12000 | θ2.6→(t12000) θ1.3·sharp | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t23106 | 1/1 | 323 | 11.5 |
| staged-plate2p6-to-branch1p3-at3000 | θ2.6→(t3000) θ1.3·sharp | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t20762 | 1/1 | 376 | 10.4 |
| staged-plate2p6-to-branch1p3-at4000 | θ2.6→(t4000) θ1.3·sharp | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t22142 | 1/1 | 432 | 10.9 |
| staged-plate2p6-to-branch1p3-at6000 | θ2.6→(t6000) θ1.3·sharp | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t22942 | 1/1 | 453 | 10.5 |
| staged-plate2p6-to-branch1p3-at8000 | θ2.6→(t8000) θ1.3·sharp | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t21973 | 1/1 | 383 | 9.6 |
| staged-plate3-to-branch1-at12000 | θ3→(t12000) θ1·sharp | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t17710 | 1/1 | 449 | 7.5 |
| staged-plate3-to-branch1-at3000 | θ3→(t3000) θ1·sharp | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t12901 | 1/1 | 458 | 5.4 |
| staged-plate3-to-branch1-at4000 | θ3→(t4000) θ1·sharp | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t13375 | 1/1 | 425 | 5.7 |
| staged-plate3-to-branch1-at6000 | θ3→(t6000) θ1·sharp | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t14618 | 1/1 | 436 | 6.0 |
| staged-plate3-to-branch1-at8000 | θ3→(t8000) θ1·sharp | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t15680 | 1/1 | 486 | 6.6 |

## three-stage (2)

plate → branch → plate double switch.

| id | recipe | ρ | κ | μ | dims | stopped | switches fired | kverts | h |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| staged3-plate-branch-plate-5000-11000 | θ2.5→(t5000) θ1.15·sharp→(t11000) θ2.5 | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t25988 | 2/2 | 431 | 10.7 |
| staged3-plate-branch-plate-7000-15000 | θ2.5→(t7000) θ1.15·sharp→(t15000) θ2.5 | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t24466 | 2/2 | 441 | 10.2 |

## bentley photo-match (7)

Hand-built staged specs chasing two Bentley monograph photographs (785 medallion, 872 tipped star). v2–v6 walk switch time and thresholds.

| id | recipe | ρ | κ | μ | dims | stopped | switches fired | kverts | h |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| bentley785 | θ2.25→(t14000) θ1.15·sharp | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t24338 | 1/1 | 477 | 6.7 |
| bentley872 | θ1.15·sharp→(t10000) θ2.25 | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t16023 | 1/1 | 768 | 2.9 |
| bentley872-v2 | θ1.15·sharp→(t6000) θ2.25 | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t24800 | 1/1 | 535 | 15.5 |
| bentley872-v3 | θ1.4·sharp→(t6000) θ2.6 | 0.12 | 0.005 | 0.001 | 500×500×96 | tick-cap t30000 | 1/1 | 320 | 17.8 |
| bentley872-v4 | θ1.6→(t8000) θ3 | 0.12 | 0.005 | 0.001 | 500×500×96 | tick-cap t30000 | 1/1 | 301 | 17.8 |
| bentley872-v5 | θ1.15·sharp→(t5000) θ2.25 | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t25259 | 1/1 | 444 | 15.6 |
| bentley872-v6 | θ1.15·sharp→(t6000) θ2.25 | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t24800 | 1/1 | 535 | 15.4 |

## animation dial-in (4)

The smooth-animation sizing runs (2026-08-08/11) — same branch1→plate3 recipe at three domain sizes plus frame-density (f2) and mesh-spacing (s06) probes.

| id | recipe | ρ | κ | μ | dims | stopped | switches fired | kverts | h |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| dialin-b1p3-500-f2 | θ1·sharp→(t4000) θ3 | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t26906 | 1/1 | 679 | 42.4 |
| dialin-b1p3-500 | θ1·sharp→(t4000) θ3 | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t26906 | 1/1 | 679 | 12.1 |
| dialin-b1p3-500-s06 | θ1·sharp→(t4000) θ3 | 0.12 | 0.005 | 0.001 | 500×500×96 | domain-contact t26906 | 1/1 | 1213 | 13.9 |
| dialin-b1p3-800 | θ1·sharp→(t8000) θ3 | 0.12 | 0.005 | 0.001 | 800×800×96 | domain-contact t28473 | 1/1 | 1132 | 19.2 |

