# Working rules — The Virtual Cloud Chamber

This project is worked on by **multiple different LLMs across sessions**, with no shared memory
between them. Any model may pick up work another left mid-flight. The markdown files described
here are the *only* handoff channel. Treat them as part of the deliverable, not as bookkeeping.

The governing document is [project charter.md](project charter.md). It defines the goal, the
science, the stack, and Phases 0–7. **The charter is the spec; these files are the state.**

---

## The three documents

| File | Answers | Written |
|---|---|---|
| `docs/PROGRESS.md` | Where is the project *right now*? | Every session that changes anything |
| `docs/plans/<phase>-<slug>.md` | What are we about to do, and why that way? | Before any non-trivial work |
| `docs/decisions/NNNN-<slug>.md` | Why is it this way and not the obvious alternative? | When a real choice gets made |

Templates live at `docs/plans/_TEMPLATE.md` and `docs/decisions/_TEMPLATE.md`.

**The solver specs** are separate, and they are the technical ground truth — read the relevant
one before writing solver code, every time:

| File | Contains | Truth status |
|---|---|---|
| `docs/gg-machinery.md` | lattice, diffusion, state, mass, melting, noise | physics-agnostic infrastructure |
| `docs/attachment-kinetics.md` | the attachment rule — Libbrecht's kinetics | **the only step that is physics** |
| `docs/libbrecht-parameters.md` | measured σ₀(T), A(T), v_kin(T), D(T,P) | empty; no number without a citation |

---

## Rule 1 — Start every session by reading the state

Before touching anything: read `docs/PROGRESS.md`, then the plan file it points at as active.
Do not infer project state from the code, the file tree, or this charter alone — they tell you
what exists, not what was *intended*, what was *tried and rejected*, or what the last model was
halfway through. If `PROGRESS.md` disagrees with the code, say so explicitly rather than
silently trusting one.

## Rule 2 — Plan in a file before you build

Any work beyond a trivial fix gets a plan file *first*, committed before implementation starts.
A plan is: the goal, the approach, the steps, the "done when", and the things deliberately not
done. Charter phases already state their own **done when** — copy it into the plan verbatim and
do not quietly soften it.

If the user approves a plan in chat, write it to the file anyway. The next model cannot read
this conversation.

## Rule 3 — Update PROGRESS.md as you go, not at the end

Sessions get cut off. A plan step that is done but unrecorded is work the next model will redo
or, worse, half-redo. Update `PROGRESS.md` when you finish a meaningful step — not only when
the whole task lands. Leaving work in progress is fine; leaving it *undescribed* is not.

Every entry states: what changed, what it proves, and what is next. Prefer "column aspect ratio
inverts at f=0.06, hollowing not yet observed" over "worked on the solver."

## Rule 4 — Record what failed, not just what worked

Dead ends are expensive and invisible. A model that doesn't know the last one already tried
`X` will try `X`. Every plan file ends with a **Tried and rejected** section, and it is a
first-class part of the document. "Kept the Laplace solve on a cubic grid, sixfold symmetry
error never dropped below threshold, abandoned" saves the next model a day.

## Rule 5 — Decisions that contradict or extend the charter get an ADR

The charter is decided, not sacred — but a change to it is a *documented* change. Write a
numbered decision record (context, decision, consequences, alternatives), and update the
charter itself in the same session so the two never drift. Never let a decision live only in a
chat transcript or a code comment.

## Rule 6 — Claims are cheap; evidence is the deliverable

This project's identity is epistemic honesty (charter §1.5), and it applies to the docs too.
Scientific milestones are **automated metrics, not screenshots** (§3.3). So:

- Never mark a phase gate done in `PROGRESS.md` without naming the metric, its value, and how
  to reproduce it (seed, resolution, command).
- Never write a physical claim the model hasn't earned. The confidence-level discipline in
  §1.5 governs prose in the docs exactly as it governs UI labels.
- "Looks right" is not a result. If you eyeballed it, write that you eyeballed it.

## Rule 7 — A bare `alpha` is banned from this repository

In code, in docs, in commit messages, in variable names, in prose. No exceptions.

Libbrecht's **attachment coefficient** (Hertz–Knudsen, dimensionless, [0, 1]) and
Gravner–Griffeath's **attachment threshold** (a boundary-mass cutoff indexed by neighbor count)
are *unrelated quantities that are both conventionally written α*. They appear in the same
update step of the same solver. A model that conflates them will produce plausible-looking
crystals for the wrong reasons — which is the worst available outcome for a project whose stated
identity is epistemic honesty (charter §1.5).

Every occurrence carries its provenance:

| Write this | Never this | Meaning |
|---|---|---|
| `alphaHK`, `alphaHKBasal`, `alphaHKPrism` | `alpha`, `α` | Hertz–Knudsen attachment coefficient |
| `ggThreshAlpha`, `ggThreshBeta`, `ggThreshTheta` | `alpha`, `beta` | G–G boundary-mass thresholds |

Enforce with a lint rule, not with vigilance. Vigilance does not survive a model handoff; a
failing build does.

## Rule 8 — Leave the next model a landing spot

End every session by making `PROGRESS.md`'s **Next step** section true and specific enough to
act on cold: the next concrete action, the file to open, the command to run, and any trap you
already know about. Write it for someone with no memory of today — because that is exactly who
reads it.

---

## Anti-rules

- Don't summarize the charter into `PROGRESS.md`. Link to it. Two copies of a spec means one is
  wrong.
- Don't keep a per-session diary. `PROGRESS.md` describes *state*, not chronology; prune it as
  work lands. Detail belongs in the plan file for that work.
- Don't create documents these rules don't call for. More files is not more clarity.
