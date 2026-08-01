# Phase 6 — what went wrong, and the rules that came out of it

**Every entry below is a real incident from Phase 6, not a hypothetical.** Each gives the rule it
produced and says whether that rule is **ENFORCED** (fails `npm test`) or **DISCIPLINE** (a judgement
a future agent has to make). Enforced beats discipline every time; where a rule could be automated it
was.

The pattern across all of them: **nothing here failed a test at the time it happened.** They were
caught by reading output, by an adversarial audit, or by luck. That is what these rules are for.

---

## A. Evidence preservation

### A1 — 89 core-hours existed in no commit

**Incident.** `out/` was gitignored and the convention (decision 0004) was "track the hashes, not the
artifact." Arm 1's 204 measurements therefore existed on one disk, in no commit, for the entire
phase. A mistyped directory suffix would have destroyed them. Arm 2's artifact *was* destroyed once
by the provenance gate and survived only because it was copied aside by hand (erratum E4).

**Rule — ENFORCED** (`runner/test/evidence-integrity.test.ts`). Anything that backs a published claim
lives in the **tracked** `evidence/` tree with a digest in `evidence/MANIFEST.json`. `out/` is
scratch and may be deleted at any time. See ADR 0038.

> **A hash proves an artifact has not changed. It does not preserve it.** That distinction cost this
> phase nothing only because of luck.

### A2 — a fresh clone would not have reproduced the published hashes

**Incident.** Creating `evidence/` printed `warning: LF will be replaced by CRLF in
evidence/phase6-sweep/points.json`. The committed blob was correct, but `core.autocrlf=true` converts
on **checkout** — so anyone cloning on Windows would get CRLF and **every sha256 in the published
reports would fail against the file they actually hold.** Intact in the object store, unverifiable in
practice. It was caught by one warning line in git's output.

**Rule — ENFORCED.** Hash-registered files carry `-text` in `.gitattributes`, and the test asks *git*
(`git check-attr`) rather than parsing the file, because the question is what git does. Verified by
checking `HEAD` out into a throwaway worktree and re-hashing: 16 of 16.

### A3 — three concurrent writers clobbered a 5.2-hour measurement

**Incident.** Three ladder drivers ran against one JSON file. Each held its results in memory and
wrote the **whole array** after every completion, from a snapshot taken at its own start time. P5-B
finished at 14:21 and wrote; P4-C finished at 14:46 and overwrote from a 05:52 snapshot. The
measurement survived only as one line in a log — without the `attached`, `symErr`, `allConverged`
fields that decide admissibility, so it had to be re-run.

**Rule — DISCIPLINE.** Any driver that appends results incrementally must **re-read and merge before
each write**, keyed on the row identity, never overwrite from memory. And a driver that can be
interrupted must treat a row without a finite measurement as **not done**, so a killed run is retried
rather than skipped forever (that was a second, separate bug in the same file).

---

## B. Registered obligations

### B1 — a mandatory registered check had never been run, and was never listed as outstanding

**Incident.** The `domain-budgets` freeze row makes the sweep's validity **conditional** on a
spot-check, registers the criterion inside the gated manifest, and registers a full-grid re-sweep as
the failure consequence. `phase6DomainSpotCheckPasses` had **no caller outside tests**. Nothing
failed. When finally run it **failed 3 of 4** (erratum E6).

### B2 — the registered headline rule was never implemented

**Incident.** `uncertainty-reporting` registers the headline as the conservative intersection of
measured and grid-extrapolated class. `phase6FitGridExtrapolation` has no caller outside tests and no
artifact carries the fields. Both published headlines were computed by a **different rule than the
registered one** (pin-register R15). Discharging it needs three grid spacings per point — 612 runs
per arm — which the registered budget never contained.

**Rule — DISCIPLINE, and it is the biggest structural gap this phase found.** *A registered output
that nothing produces, and a registered check that nothing calls, are indistinguishable from not
being registered at all.* Preflight should assert that every registered output was produced and every
registered check was executed. **This is not yet implemented** and is carried as an open item.

### B3 — a registered remediation that does not remediate

**Incident.** E6's registered consequence is "raise the domain to N = 64 and re-run the entire grid."
Before spending ~780 core-hours, the same criterion was applied one rung up: **N = 64 fails it too, 3
of 4.** The mandated fix would have produced 408 fresh points failing the check that ordered them.

**Rule — DISCIPLINE.** Before executing a registered remediation, **verify its target satisfies the
condition it is meant to restore.** A consequence written into a protocol is a hypothesis about the
fix, not a proof of it.

---

## C. Reasoning failures

### C1 — "the gate refused to publish" read as "the measurements are void"

**Incident.** The completion-time provenance check refused arm 2's artifact. I launched a full
11.5-hour re-run, stopped at 0/204. Zero files under the hashed source roots had changed; it was a
provenance failure, not a physics failure, and the artifact was regenerable (erratum E4).

**Rule — DISCIPLINE.** **Spend the hours that tell you the expensive thing is necessary, before
spending the days.** Applied successfully twice afterwards: the N=64 adequacy check (4 h) cancelled a
780 core-hour re-sweep; the convergence study decided a multi-day question with four runs.

### C2 — the diagnostic's design used the reasoning its own protocol disproves

**Incident.** The columns ladder held `targetExtent / N = 0.4375` and argued it kept the far-field
treatment comparable. The `domain-budgets` row states the opposite in as many words: the validity
limit **is not a ratio** and must be re-measured when the measurement extent changes. I found this
*after* publishing a correction built on those rungs. It also cost compute — extent 35 was legal at
N = 64 (0.547 < 0.65) and was run at N = 80.

**Rule — DISCIPLINE.** **Read the freeze rows governing a quantity before designing a diagnostic that
varies it.** The registered protocol is not only a constraint on evidence runs; it contains measured
findings that make some designs invalid.

### C3 — a comparative conclusion with no control in the design

**Incident.** P1 crossed the column floor and the obvious next sentence was "SDAK did it" — but the
ladder had **no arm-1 run at those conditions**. P4 was arm 1's best regime point and sat at a
different supersaturation entirely. The claim rested on extrapolation.

**Rule — DISCIPLINE.** For any comparative claim, the control must exist **in the design**, at
matched conditions. Adding it afterwards is acceptable only when it can **only weaken** the
conclusion, and that must be recorded in place (P5 was, and it survived).

### C4 — a census claim from a partial file

**Incident.** At 159 of 204 points I wrote "not a single column anywhere in 204 points across both
arms." False — arm 1 had 30, and I could have checked the completed arm at the time.

**Rule — DISCIPLINE.** No census, extremum or "not one" claim from an incomplete artifact.

### C5 — recomputing a published quantity under a different scoping

**Incident.** I reported `columns-and-plates` as 27/84 → 19/84 from my own census. The published
`report.json` says **26/78 → 14/78** — the registered per-regime tallies already exclude the ±1.0 °C
ambiguity band.

**Rule — DISCIPLINE.** Quote the published artifact's fields. If you recompute, state which rule you
used and reconcile against the artifact before publishing.

### C6 — a pre-registered outcome that could not be computed

**Incident.** The columns pre-registration made outcome 2 "flat within one representable step". The
step turned out **not computable** at the new measurement sizes: the lattice-permitted AR set is
nearly dense, while what a D6h crystal realizes is far coarser (36 distinct values in 408
measurements) and is an empirical quantity only established where many crystals exist.

**Rule — DISCIPLINE.** A pre-registration must state **how each outcome is computed**, and that
computation should be demonstrated on existing data before the deciding runs launch.

---

## D. Process

### D1 — audit findings that never left the raw file

**Incident.** The 2026-07-29 adversarial audit found that the entire WP3 convergence campaign ran the
parameter set ADR 0031 invalidated (**CRITICAL**), and that the domain spot-check had never run
(**HIGH**). Both sat in `docs/phase6-soundness-audit-2026-07-29.raw.txt`. **No ADR, no erratum, no
report carried them** until 2026-07-31.

**Rule — DISCIPLINE.** An audit is not closed when its findings are written down. It is closed when
each finding is **propagated to the document a reader of the evidence would actually meet**, or
explicitly recorded as declined. A raw dump is a work product, not a record.

### D2 — a suite-green claim from a corrupted measurement

**Incident.** Three background `npm test` runs shared one log path; killing a wrapper does not kill
the vitest child. I reported exit 0 from a contaminated log and had to retract it.

**Rule — DISCIPLINE.** Unique log path per run; verify no stale process before starting; name the
exact command beside any suite-green claim. Only exact `npm test` counts.

### D3 — test-only hooks reachable from the evidence path

**Incident.** `testAlphaOverride` replaces `alphaHK` wholesale — the quantity Phase 6 measures — and
"never set in runs" was enforced by a doc comment. The executed mutation scored plate/AGREE with
every hash unmoved and the suite green (R26).

**Rule — ENFORCED.** The hooks now throw without an explicit opt-in, and a suite-integrity test
asserts the runner contains no route to satisfying it.

---

## What could NOT be automated, and why it matters

B2's rule — *preflight asserts every registered output was produced* — is the one that would have
caught B1, B2 and R55 generically, years of small omissions in one check. It is **not implemented**.
Until it is, "registered" and "produced" remain different things in this project, and the gap is
invisible.

That is the single highest-leverage piece of unbuilt apparatus Phase 6 identified.
