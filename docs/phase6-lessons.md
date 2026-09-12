# Phase 6 — what went wrong, and the rules that came out of it

**Every entry below is a real incident from Phase 6, not a hypothetical.** Each gives the rule it
produced and says whether that rule is **ENFORCED** (fails `npm test`) or **DISCIPLINE** (a judgement
a future agent has to make). Enforced beats discipline every time; where a rule could be automated it
was.

The pattern across the original incidents: **none failed a test when it happened.** They were
caught by reading output, by an adversarial audit, or by luck. Later regression tests do fail for
several corrected assertion defects; that does not retroactively make the original evidence path
fail closed. That distinction is what these rules are for.

---

## A. Evidence preservation

### A1 — 89 core-hours existed in no commit

**Incident.** `out/` was gitignored and the convention (decision 0004) was "track the hashes, not the
artifact." Arm 1's 204 measurements therefore existed on one disk, in no commit, for the entire
phase. A mistyped directory suffix would have destroyed them. Arm 2's artifact *was* destroyed once
by the provenance gate and survived only because it was copied aside by hand (erratum E4). The same
failure repeated in the cross-platform control: Tier 2 arm64 logs and exit records stayed in
gitignored `out/`, were never promoted, and are now unavailable. Only a prose table survives, so the
reported end-to-end match is not independently rederivable.

**Rule — DISCIPLINE.** Anything that backs a published claim lives in the **tracked** `evidence/`
tree with a digest in `evidence/MANIFEST.json`. `out/` is scratch and may be deleted at any time.
Before publishing, audit claim-to-artifact coverage explicitly: a file-tree test cannot discover a
claim-backing artifact that the producer omitted from both the tree and manifest. See ADR 0038.

**Targeted regression — ENFORCED** (`runner/test/evidence-integrity.test.ts`). Every file already
published under `evidence/` must appear in the manifest, and every manifest entry must exist with its
registered byte length and digest. This enforces integrity and inventory closure inside the evidence
tree; it does not automate the claim-to-artifact census.

> **A hash proves an artifact has not changed. It does not preserve it.** That distinction cost this
> phase nothing only because of luck.

### A2 — a fresh clone would not have reproduced the published hashes

**Incident.** Creating `evidence/` printed `warning: LF will be replaced by CRLF in
evidence/phase6-sweep/points.json`. The committed blob was correct, but a checkout configuration
such as `core.autocrlf=true` can convert the bytes — so affected Windows checkouts would get CRLF
and **every sha256 in the published reports would fail against the file they actually hold.** Intact
in the object store, unverifiable in that checkout. It was caught by one warning line in git's
output.

**Rule — ENFORCED.** Hash-registered files carry `-text` in `.gitattributes`, and the test asks *git*
(`git check-attr`) rather than parsing the file, because the question is what git does. The current
manifest contains 18 files; the regression checks the effective attribute on all 18 rather than one
representative path. The earlier throwaway-worktree rehash covered the then-current 16-file manifest;
the two later Tier 1 fingerprints still require the same clean-checkout rehash before a new
fresh-clone count is claimed.

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
spending the days.** The N=64 adequacy check (4 h) correctly prevented an invalid 780 core-hour
re-sweep at that domain. The later four-run CAK_A1 study was only a sparse diagnostic: it did not
decide the registered R15 grid/domain question or complete the scientific obligation.

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

**Rule — DISCIPLINE.** For any comparative claim, the control must exist **in the registered
design**, at matched conditions. A post-hoc control can diagnose or weaken an earlier inference,
but it cannot acquire pre-registration or gate standing after the result is known. Its post-hoc
status and exact evidentiary limit must be recorded in place.

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

---

## E. The failure this list did not contain, found by external review

### E1 — every gap honestly recorded, and a summary the gaps did not support

**Incident (2026-08-01).** A non-author review by OpenAI `gpt-5.6-sol` at ultra reasoning effort,
with inherited repository and development context, independently recomputed three decisive numeric
claims and found no solver defect in that reviewed scope — then found that Phase 6 had been called
"concluded" while the conclusion's own §3.5 said the registered headline rule was never implemented.
**Both cannot stand.** 3/90 and 54/90 are valid *measured-only* counts and are **not registered
headline verdicts**; that alone prevents gate acceptance.

The review found seven more, all valid: charter obligations omitted without an amending ADR; a
positive SDAK claim promoted above the evidence status its *own* pre-registration assigned it; an
environment-inheritance forgery path present in the audit and absent from the conclusion; a
fragility rule whose directional justification **my own ladder had already refuted**; a
cross-platform claim generalized from four runs to both arms; five state documents contradicting one
another; and a mathematically impossible explanation of a logarithm base.

**What makes this a distinct failure class.** Every one of those gaps was *already written down
somewhere in this repository, by me, honestly.* R15 was in the pin register and in §3.5. The
diagnostic's inadmissibility was in the pre-registration I wrote. The `NODE_OPTIONS` path was in the
audit. The falling AR was in my own ladder table. **Nothing was hidden. The summary simply did not
follow from the parts.**

**Rule — DISCIPLINE.** *Recording a limitation is not the same as honouring it in the conclusion.*
Before writing any status line, re-read your own "what this does not establish" section and ask
whether the headline survives it. A document that lists blockers and then declares completion has
not been careful — it has been careful in the parts and careless in the aggregate, which reads as
worse than sloppiness because the evidence of the contradiction is in the same file.

**Corollary — DISCIPLINE.** A non-author reviewer reproduced the three decisive numbers in hours
and found eight issues that eight sessions of self-audit did not. **Adversarial review by a party
that did not author the work is not a formality**, and its findings should be checked and accepted
on their merits rather than argued down. All eight issues in that review set were verified before
acceptance; that is not an exhaustive certification of Phase 6.

**Review limit.** That review did **not** execute the full Phase 6 campaign, inspect every artifact
byte, or validate the later O1b repairs. Its accepted findings and the resulting gate reopening are
propagated through [the corrected conclusion](../research/phase6-conclusion.md), the active
[science-first completion plan](plans/phase-6-science-first-completion.md), and
the then-current handoff (`docs/HANDOFF.md`, retired to a tombstone 2026-08-20; its snapshots
are in Git history). Subsequent non-author review found additional propagation and
protocol defects, so only the latest dated review state may support a clean-review claim.

### E2 — a true endpoint silently became a false range summary

**Incident (2026-08-01).** The later-paper comparison correctly computed the −2 °C digitized
prism barrier as 0.028% against a 0.03% source fit (6.7% low), then summarized both −2 °C and
−5 °C as “agreement to ~7%.” At −5 °C the actual pair is 0.27% against approximately 0.20%:
35% high. The same review found a claimed `A_prism` absolute bound of 0.015 whose actual maximum
was 0.03247, 14 and 19 intervening temperature *rows* mislabeled as °C spans, and an attached-cell
count mislabeled as total accreted mass. It also found 6,561/19,683 unique relative-factor patterns
mislabeled as independent lower/upper corners; that independent-corner space is 65,536/262,144.

**Rule — PARTLY ENFORCED.** A range, maximum, or cross-point summary must be recomputed over the
exact named set and retain its unit, denominator, and extremizing witness. The closed-form script
now prints both project/source-fit comparisons and a regression pins 0.028%/0.03% and
0.27%/0.20%; prose review remains necessary. Never promote occupancy count to mass or a row count
to a coordinate interval merely because the numbers sound physically related.

### E3 — the authority audit must follow the complete diff

**Incident (2026-08-01, before decision 0040 was accepted).** The then-proposed decision quoted
every clause it said it amended, yet that candidate charter also changed §2.2's premelting claim
and §2.6's treatment of omitted latent heat
and surface diffusion. Those changes were scientifically preferable but unauthorized by the ADR's
declared scope. A later acceptance audit found the same failure in §2.4, §3.1, Phase 2b and Phase 4,
and caught edits to the accepted revision header/marker; the substantive clauses had to be added to
the quote/decision inventory, while the unintended revision-marker edits were restored byte-exact.
The same aggregate summary said all later printed mappings were in the parameter table while the CM8
broad forms and FACET two-branch table were still absent.

**Rule — DISCIPLINE.** Audit the complete charter and parameter-table diffs, not only the sections
named by the author. Every changed charter clause is quoted and decided; every claimed source
mapping is present with formula/table, page, units, provenance, and implementation status. A
correct conclusion without a complete authority trail is still not a governed project decision.

### E4 — a clean prose design can still contradict a reachable machine state

**Incident (2026-08-01).** Decision 0039 was marked accepted after several design reviews, but its
decoder contract rejected an unattached boundary cell at exact `f=1`. The current solver and v2
validator already document why that state is reachable: the update may take the unsaturated branch
with `raw < 1 - f`, then binary64 addition rounds `f + raw` to one. Attachment occurs on a later
cycle only when the fill loop executes and that cell's computed raw increment is nonnegative; the
positive-field production lane guarantees the local sign, but a general subsaturated checkpoint
does not. The state may also persist through a globally stalled zero-rate cycle. Implementing the written invariant would have rejected a valid direct-run
checkpoint or forced a numerical-evolution change to make the design appear correct. The same readiness audit found that
runner run-spec, manifest, policy, cadence and retention details were being treated as accepted before
WP3 had frozen their scientific inputs.

**Rule — DISCIPLINE.** Before accepting a state-format design, trace every rejection invariant through
the current mutation code and construct its boundary witness. A schema review is not an
implementation-readiness review. Separate protocol-independent state preservation from
campaign-dependent controls; do not let implementation choose a scientific input that the protocol
has not frozen. A later review finding supersedes an earlier clean verdict until the corrected bytes
receive a fresh review.

### E5 — a controlled software ablation does not establish physical causality

**Incident (2026-08-01).** The review correctly rejected CAK→M1 as a dip ablation because that switch
also changes broad barrier functions and a facet prefactor. The replacement plan then repeatedly
called the matched M1/no-dip pair the “required causal design” without naming the estimand. Holding
the implementation fixed and replacing only its dip factors can isolate those factors' effect on
this solver's outputs under the frozen configuration. It cannot establish that physical SDAK is
causal or necessary in nature. The same wording audit caught “the source prints P3 algebra”: the
source prints algebra, while P3 is this project's provenance classification and the unstated
logarithm-base resolution is a separate P4 choice.

**Rule — DISCIPLINE.** Every causal claim names the intervention, outcome, system, and scope. A
matched code intervention supports an implementation-level causal contrast; a physical mechanism
claim requires external identification evidence that the simulation cannot supply about itself.
Likewise, keep source content separate from project metadata: say what the source prints first, then
state the provenance class the project assigns and any independent transcription choice. Propagate
both distinctions through status, specs, reports, education, and outward-facing material before
acceptance.

### E6 — a sibling manifest does not inherit another manifest's hash binding

**Incident (2026-08-01).** Acceptance records said the historical parameter-table hash remained
“inside both legacy values manifests.” Direct inspection of the canonical producers showed that arm
1 does carry `parameterTableSha256`, while arm 2's independently frozen M1 values manifest never had
that field. Arm 2 binds the exact M1-related fields and freeze/source identity its producer
serialized, under its own values hash; it does not thereby bind every executable constant.
Retrofitting a table digest after execution would change the historical schema and identity rather
than preserve them. The summary inferred symmetry between related manifests that serialize
different key sets.

**Rule — DISCIPLINE.** A claim that a hash binds a value requires inspection of the canonical
serialized bytes or producer key set, plus a mutation showing that the named value moves the digest.
Never infer a binding from a sibling manifest, prose freeze row, or combined hash. When a correction
needs a new current identity, preserve each historical manifest exactly as it was and add a
separately named current path; document absent historical fields as absent rather than quietly
backfilling them.

**Targeted regression — ENFORCED.** `runner/test/phase6-arm2.test.ts` asserts the two current
historical producer key sets and proves that changing arm 1's table field or retrofitting it into arm
2 changes the corresponding manifest digest. That test protects these two named manifests; it does
not mechanically establish the general claim-to-hash discipline for future schemas.

### E7 — one successful setting does not establish uniqueness or sensitivity

**Incident (2026-08-01).** A learner-facing pre-registration demo correctly showed that the
published dip centres score 15/15 under its deliberately invalid input-order proxy, then claimed
that moving the dips “anywhere else” makes the score collapse. An exhaustive check of the demo's
actual 0.1 °C slider grid found **3,144** centre pairs scoring 15/15, including **3,143** pairs other
than 4.5/14.4; 3.0/22.6 is one counterexample. The browser verifier exercised only the default
revealed branch, so its green result authenticated a witness while missing the false landscape
summary.

**Rule — DISCIPLINE.** A sensitivity, uniqueness, or “any other setting” claim is a statement
about a domain, not about the chosen witness. Enumerate the stated finite domain or run an explicit
counterexample search before publishing it. Interactive verifiers must exercise at least one
scientifically distinct non-default branch and pin the visible interpretation, not only the default
formula. Prose elsewhere still requires adversarial review.

**Targeted regression — ENFORCED.** The education verifier executes the 3.0/22.6 perfect-score
counterexample and rejects erasure of the visible non-uniqueness warning. That regression protects
this interactive's known branch; it does not automate the general domain-claim discipline.

---

## What could NOT be automated, and why it matters

B2's rule — *preflight asserts every registered output was produced* — is the one that would have
caught B1, B2 and R55 generically, years of small omissions in one check. It is **not implemented**.
Until it is, "registered" and "produced" remain different things in this project, and the gap is
invisible.

That is the single highest-leverage piece of unbuilt apparatus Phase 6 identified.
