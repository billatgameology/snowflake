# 0039 — LK resume checkpoints preserve the complete cycle-boundary state

- **Date:** 2026-08-01
- **Status:** proposed; the corrected core checkpoint/restore design passed fresh non-author review
  with 0 blockers/should-fixes, while the protocol-dependent runner contract remains deferred until
  WP3 freezes and independently reviews its inputs
- **Charter impact:** none. This adds a new resume-only checkpoint version without changing the
  meaning or bytes of GG v1 or LK v1/v2. The governing clauses already require checkpointed solver
  state and explicitly reserve a new decision/version for resumability:

  > “Repository structure — the solver is not the app. Five parts from the start: core (model
  > definitions, parameters, morphology metrics, checkpoint format), solver-cpu (the oracle),
  > solver-gpu (WGSL passes), runner (headless CLI), and app (the Three.js instrument). The
  > checkpoint format — JSON metadata plus binary field snapshots — lives in core and is defined
  > early, because oracle-vs-GPU comparisons, regression tests, and the sweep harness all speak
  > through it. Checkpoint metadata records the far-field boundary condition of every run (§2.4).
  > The headless runner executes the same WGSL solver under Playwright 1.61.1's lockfile-pinned
  > Chromium revision 1228 (decision 0017), so parameter sweeps, atlas generation, and overnight
  > runs never require a visible browser tab. The controlled evidence runtime records its exact
  > browser product/revision, observed backend, adapter, driver where exposed, limits, and launch
  > flags on the Windows gate host. Chromium's development-only adapter fields are evidence
  > instrumentation, not production-app dependencies. The GUI is one client of the solver, not its
  > home.” (§3.1)

  > “The far-field boundary condition (added v1.2). Gravner–Griffeath as published close the box:
  > a reflecting (no-flux) outer boundary conserves total vapor, so the crystal grows by consuming
  > a finite reservoir and σ falls over the run. A morphology grown that way records a downward
  > trajectory through σ-space, not a held point. Nakaya coordinates — and Libbrecht's controlled
  > measurements — assume a maintained far-field supersaturation. The solver therefore supports
  > three far-field conditions: reflecting (G–G fidelity; the Phase 2a default), fixed-σ Dirichlet
  > (the domain edge is held at the set supersaturation — vapor is replenished), and
  > monopole-matched (added v1.17, decisions 0024 and 0027 — the shell is held at the monograph's
  > Eq. 5.30 per-pixel value `σ∞ − (dV/dt)/(4π·ρ_far·X₀·v_kin)` rather than flat at `σ∞`). **Every
  > Phase 6 validation run must NAME its far-field condition in the frozen protocol, and the
  > registered condition is monopole-matched** (superseding v1.2's requirement of fixed-σ
  > Dirichlet; see decision 0027 for why). Which condition a run used is recorded in its checkpoint
  > metadata; the three are not interchangeable and results must never be compared across them
  > silently. Phase 2b, 4 and 5 evidence keeps the condition that produced it and is never pooled
  > with Phase 6 sweeps.” (§2.4)

  > “Existing checkpoint meanings do not change; the schedule and event log accompany final-state
  > evidence.” (§3.2, Phase 4)

  > “Determinism scope (added v1.2). Bitwise reproducibility is claimed only for the oracle pinned
  > to one engine (Node/V8): the JS spec does not guarantee bit-identical Math.exp/Math.pow across
  > engines, and LibbrechtKinetics leans on exp(). Float32 GPU vs float64 oracle and any future
  > cross-engine or cross-backend comparison use stated tolerances, never bitwise equality; FMA
  > contraction and driver shader compilers differ legitimately. “Deterministic seeds throughout”
  > therefore means bitwise within the pinned oracle and tolerance-bounded on the recorded Windows
  > GPU stack. Untested backends carry no Phase 5 claim.” (§3.1)

  > “Protocol freeze (added v1.2 — pre-registration; expanded v1.3–v1.4 and v1.7, decisions
  > 0005–0006 and 0009). Before the first validation sweep runs, freeze
  > docs/libbrecht-parameters.md and a written validation protocol: the T/σ grid; the far-field
  > boundary condition (named per §2.4;
  > monopole-matched as of v1.17, decision 0027); how a model habit class is scored against the
  > reference regimes, including the treatment of a neutral class and the near-boundary ambiguity
  > band (added v1.17, decision 0025); how any extrapolated quantity the report consumes is computed
  > and when it is refused (added v1.17, decision 0026); the crystal size at which habit is measured
  > — habit is size-dependent, so measuring at a stated maximum dimension is what keeps comparisons
  > apples-to-apples; metric thresholds; domain budgets; and pressure, physical seed size, Δx, the
  > named surface policy, the fill-CFL bound, the diffusion residual tolerance and its norm, the
  > divergence-identity tolerance, the relaxation-sweep cap, float precision, the parameter
  > interpolation scheme, noise amplitude, seed-ensemble size, the model/code version (commit hash),
  > and the uncertainty-reporting scheme. Any post-freeze edit to parameters or protocol requires a
  > logged ADR and invalidates prior sweep results — the full sweep re-runs. This is what makes “a
  > negative result is a result” survive contact with a disappointing plot.” (§3.2, Phase 6)

  > “Phase 6 runs pre-registered (added v1.2). The parameter table and validation protocol freeze
  > before the sweep; post-freeze edits are ADR-logged and force a full re-sweep. This does not make
  > misconduct impossible; it makes authorized changes explicit and supplies reviewers with
  > versioned artifacts against which undisclosed drift can be detected.” (§3.3)

  Decision 0011 made the reserved extension explicit: “resumable mid-history checkpoints would
  require a new version, schedule cursor, mutation tests, and a separate decision.” This decision is
  that separate decision for constant-environment Phase 6 runs. It does not authorize timeline
  resume.

## Context

Phase 6's planned science-first completion campaign requires thousands of separately specified
float64 CPU runs. A single registered case can spend longer in elliptic relaxation than the historical
three-hour timeout. Treating a process interruption as a reason to restart from zero wastes work;
pretending the existing LK v2 snapshot is resumable changes the calculation silently.

LK v1/v2 records controls plus `a`, `f`, and `sigma`. That is sufficient for a final-state snapshot,
but not for bit-identical continuation:

- monopole matching uses `volumeRateM3PerS` from the previous completed interface update in the next
  shell clamp;
- `boundaryList` insertion order is historical and load-bearing for float64 reductions, fill-ledger
  addition, simultaneous attachment ordering, and future boundary insertion;
- the fill, clipping, hole-fill, and temperature-segment ledgers are cumulative observable state;
- `lastRelaxation`, `lastAttached`, physical time, hole-fill count, and the most recent maximum fill
  velocity are part of the solver's public report state; and
- the retained trace must independently derive historical morphology extrema, symmetry witnesses,
  stop precedence, and a completed-step count equal to the checkpoint tick. It retains producer
  convergence reports and independently validates their declared ranges, v6 diagnostic algebra and
  outward-envelope drift bound; it does not rederive historical residual, shell or exchange values
  from absent per-sweep fields. It can also verify the arithmetic recurrence of copied ledgers and
  time. The trace likewise does not retain sufficient inputs to independently rederive the physical
  correctness of a past fill delta or monopole rate; this decision does not pretend otherwise. Those
  historical values cannot be reconstructed from a v2 final snapshot.

Supplying zeros, sorting the boundary set, scanning it back in index order, or recomputing campaign
extrema from only the final fields would therefore create a different run while retaining plausible
metadata. That is scientifically worse than losing the work.

## Decision

### 1. Keep every existing checkpoint meaning frozen

`encodeLKCheckpoint` continues to emit byte-identical LK v2 final snapshots. `decodeLKCheckpoint`
continues to accept only v1/v2 and rejects v3 by name. GG v1 is untouched. No missing resume state is
invented for an old checkpoint.

The additive APIs are named separately and are streaming by contract:

```ts
interface LKResumeByteSink {
  write(chunk: Uint8Array): Promise<void>;
}

interface LKResumeByteSource {
  readonly byteLength: number;
  readExactly(offset: number, target: Uint8Array): Promise<void>;
}

encodeLKResumeCheckpointV3(
  state: LKResumeStateV3,
  sink: LKResumeByteSink,
): Promise<LKResumeEncodingSummary>;

decodeLKResumeCheckpointV3(
  source: LKResumeByteSource,
): Promise<DecodedLKResumeCheckpointV3>;

LKSolver.resumeStateV3(): LKResumeStateV3;
LKSolver.fromResumeStateV3(decoded: DecodedLKResumeCheckpointV3): LKSolver;
```

The resume decoder rejects v1/v2 by name. A final-state reader does not silently become a resume
reader. Small-buffer source/sink adapters may exist for unit tests, with a hard size cap; no
production API returns or accepts one monolithic checkpoint `Uint8Array`.

`DecodedLKResumeCheckpointV3` is an opaque, runtime-branded, single-consume ownership envelope, not
a reusable data-transfer object. `fromResumeStateV3` atomically takes its owned arrays; a second
take, a shallow object copy, or an object lacking the runtime brand is rejected before construction.
The brand and consumed state live in module-private `WeakSet`s keyed by object identity; an
enumerable or symbol property on the envelope is not sufficient because a shallow copy can reproduce
it. The decoder releases no partially filled envelope on failure. This prevents two solvers from
aliasing the same mutable fields after an apparently valid decode.

### 2. Version 3 supports completed interface-cycle boundaries only

The first resume format permits exactly `resumePhase = "cycle-boundary"` and solver
`cycleState = "boundary"`. It may be written before the first relaxation or after a complete,
successful `advanceSurface`; the production runner writes it only after it has independently
validated and appended that completed step's trace record.

The format refuses `relaxing`, `ready`, `advancing`, `incomplete`, and `transitioning`. It stores no
scratch-buffer parity or accepted nonlinear boundary cache, because neither is live at a cycle
boundary. Intra-relaxation safe points are deferred to a later version/decision if measurement shows
that losing one relaxation is unacceptable.

Phase 6 v3 is constant-environment only. The solver tracks a cumulative accepted-environment-event
count; export requires that count, the closed-temperature ledger, and the current
temperature-segment origin all be exact positive zero. Those values are not serialized, and restore
sets them to exact positive zero. Thus even a same-temperature event is detected and rejected rather
than disappearing from history. A timeline-capable version would additionally need the immutable
schedule, its hash, the event cursor, the fired-event log, and the two segment-ledger values, with
their invariants tested.

Initial v3 production eligibility is deliberately narrower than the solver: float64 CPU,
`hexPrism`, `aggregate-hv-g1h1-v6`, `monopole-matched`, and constant environment. The solver also
tracks a cumulative `testHookEverUsed` flag. Supplying either `testAlphaOverride` or
`testExtraSeedSites` sets it before either hook is consumed, including an empty extra-site list; the
flag can never return to false. Export requires false. This closes the otherwise invisible case in
which `testExtraSeedSites` already changed the initial topology and no live hook remains to inspect.

The v3 Phase 6 parameter-set allow-list is an exact, version-scoped switch, not the shared
`isNucleationParamSet` predicate: `CAK`, `M1`, and the reserved spelling
`M1_NO_DIP_ABLATION`. The reserved spelling is a wire/schema reservation only; it remains
production-ineligible until its own accepted scientific decision and core implementation exist.
`CAK_A1`, an unknown string, and any later shared-core parameter set are rejected. Every allow-listed
set must pass the direct/resume matrix in Section 6 before its first production row. Supporting
another parameter set, policy, far field, domain, GPU precision, or timeline mode requires an ADR,
a new checkpoint version, and the same continuation and mutation coverage; adding a value to a
shared enum must never broaden the decoder silently.

V3 is not mathematically necessary for one uninterrupted row, but it is mandatory before the first
R15 production row. Timeout, retry, and checkpoint semantics must be frozen uniformly before the
campaign, and a killed row may not become a scientific exclusion. Explicitly non-transferable
reconnaissance may remain cold-start-only.

### 3. Serialize evolution-bearing and observable state; recompute derivable state

The v3 envelope retains the existing eight-byte `VCCCKPT1` magic and little-endian `uint32` JSON
header length. `MAX_LK_RESUME_HEADER_BYTES` is exactly 65,536 bytes; a zero-length or larger header
is rejected before JSON parsing or payload allocation even though the length word could represent
more. The header is canonical UTF-8 JSON with this exact top-level property order:

```text
version, rule, checkpointKind, endianness, resumePhase, cycleState, timelineMode,
dims, tick, rngSeed, noiseEpsilon, domain, center, tempC, sigmaInfinity, dxUm,
pressurePa, paramSet, cflFill, relaxTol, divTol, relaxMaxSweeps, surfacePolicy,
farField, topology, solverCounters, fields
```

The fixed tags are `version = 3`, `rule = "LibbrechtKinetics"`,
`checkpointKind = "lk-resume"`, `endianness = "LE"`, `resumePhase = "cycle-boundary"`,
`cycleState = "boundary"`, and `timelineMode = "none"`. `topology` records active, shell,
attached, boundary, and last-attachment counts plus the hex radius and vertical half-extent.
`solverCounters` records the cumulative hole-fill count, whether a last relaxation exists, its
sweep count and converged flag, and the resume-scalar null mask. Nested objects and field descriptors
also have fixed exact key sets and order.

The exact nested property order is:

```text
dims:             nx, ny, nz
topology:         activeCellCount, shellCellCount, hexRadius, zHalfExtent,
                  attachedCount, boundaryCount, lastAttachedCount
solverCounters:   holeFillCountTotal, lastRelaxationPresent, lastRelaxationSweeps,
                  lastRelaxationConverged, resumeScalarNullMask
field descriptor: name, dtype, length
```

`dims` is an object of three positive safe integers whose product is a positive safe integer and fits
every typed-array/index limit checked before allocation. `center` is exactly a three-element JSON
array `[i,j,k]` of safe integers with `0 <= i < nx`, `0 <= j < ny`, and `0 <= k < nz`. The core
decoder validates only those protocol-independent range/topology constraints; the runner generation
verifier cross-checks the centre against the WP3-frozen R15 run spec. `tick` is a nonnegative safe
integer, `rngSeed` is a uint32 integer, and `relaxMaxSweeps` is a positive safe integer. Every
topology count and extent is a nonnegative safe integer and is bounded by the recomputed domain.

`fields` is exactly a JSON array of length six, not an object or iterable accepted by coercion. Its
six descriptors use exact names/order/dtypes
`a:u8`, `f:f64`, `sigma:f64`, `boundaryOrder:u32`, `lastAttached:u32`, followed by
`resumeScalars:f64`; the scalar block makes six descriptors total. Lengths are respectively
`n, n, n, B, L, 12`. The header-level `endianness = "LE"` applies to every multibyte dtype.
When `lastRelaxationPresent = false`, the only canonical counter values are sweeps `0`, converged
`false`, and null mask `4032` (bits 6–11 set; slots 0–5 present). Under the initial fixed v6 /
monopole scope, a present report requires `1 <= sweeps <= relaxMaxSweeps`, converged `true`, and null
mask `0`; all six report scalars are present. In the initial constant-environment eligible state
space, the report is absent if and only if `tick = 0`: every successful interface step follows an
accepted relaxation, while any environment event that could clear the report makes export
ineligible.

Every noninteger control in the header—`noiseEpsilon`, `tempC`, `sigmaInfinity`, `dxUm`,
`pressurePa`, `cflFill`, `relaxTol`, and `divTol`—is a lowercase 16-hex-digit string containing the
exact IEEE-754 binary64 bit pattern in conventional most-significant-nibble-first order. Decode
bitcasts the pattern and then applies the semantic range check. No binary64 control passes through a
JSON number, so signed zero and every admitted finite value round-trip exactly. Integer counts remain
JSON safe integers.

The solver retains the original admitted `dxUm` bit pattern for v3; export must not reconstruct it by
dividing `dxM` by `1e-6` and restore must derive `dxM` from that retained input in the ordinary
constructor operation order. Dimensions and centre are likewise owned primitive snapshots rather
than caller-mutable option objects. Direct/resume tests use controls chosen to expose a one-ulp
round-trip error, not only convenient decimal values.

Before allocating or reading payload storage, layout validation requires all of the following:
`source.byteLength`, header length, `n`, `B`, `L`, every field byte length, every intermediate offset
and the final total are nonnegative exact safe integers; header length fits `uint32`; `B <= n` and
`L <= n`; and every serialized index is an integer in `[0,n)`. The wire index representation also
requires `n - 1 <= 0xffffffff`. The initial solver implementation is stricter because its lattice,
shell and neighbor representations use signed 32-bit indices: v3 production rejects `n >
0x7fffffff` until a separate representation audit changes that ceiling. Arithmetic overflow,
impossible typed-array lengths and a source length other than the exact planned total fail before
the first large allocation.

After the header, the core v3 payload serializes this exact sequence in little endian:

```text
a                 u8[n]
f                 f64[n]
sigma             f64[n]
boundaryOrder     u32[B]
lastAttached      u32[L]
resumeScalars     f64[12]
```

V3 has its own exact descriptor type and does not broaden or reinterpret the frozen legacy
`FieldDescriptor` union.

The exact payload length is `n + 8n + 8n + 4B + 4L + 8*12` bytes. The scalar slots are:

```text
 0 simTimeSeconds
 1 volumeRateM3PerS
 2 lastMaxFillVelocityMS
 3 fillLedger
 4 holeFillDeficit
 5 saturationClippedFill

 6 lastRelaxation.residual
 7 lastRelaxation.divergenceResidual
 8 lastRelaxation.shellClampDiagnostic
 9 lastRelaxation.surfaceExchangeDiagnostic
10 lastRelaxation.smootherDriftDiagnostic
11 lastRelaxation.minLocalSurfaceExchangeDiagnostic
```

Slots 0–5 are always present, finite, and nonnegative; a zero in any of those evolution scalars must
use canonical positive-zero bits at every tick. The six report slots are all null when no
report exists; when it exists, nullability must match the selected far-field condition and surface
policy. The header carries the exact null bitmask. A null slot contains canonical positive-zero
bits. A non-null slot is finite and retains its raw float64 bits when nonzero. A numerical zero in
**any** report slot 6–11 must use canonical positive-zero bits. No current-solver witness establishes
a reachable negative zero for slots 8–11 in the initial nonnegative v6/monopole production lane, so
the format does not admit one speculatively. Residual and divergence zeros also follow the independent
derivation rules below. No report number passes through JSON.

The core decoder enforces the protocol-independent structural and domain invariants listed below.
The runner adds production reachability constraints—including nonnegative active `sigma` with
canonical zero—after binding the parent, trace, run spec, and campaign. In addition to the field constraints already enforced by LK v2 (`a` is
binary, `f` is finite in `[0,1]`, and `sigma` is finite and at least `-1` without any positivity
requirement), core enforces the conditions explicitly assigned to it below. Conditions assigned to
the runner generation verifier are identified as such:

- every attached cell has exact `f=1` and canonical positive-zero `sigma`; every inactive wall has
  canonical positive-zero `a`, `f`, and `sigma`; every zero `f` has canonical positive-zero bits;
  an active unattached non-boundary cell has canonical positive-zero `f`; and an active unattached
  boundary cell has finite `0 <= f <= 1`. The closed upper endpoint is intentional: the existing
  update can take the unsaturated branch because `raw < 1 - f`, then binary64 addition can round
  `f + raw` to exactly one without attaching. That state is reachable at a cycle boundary and
  attaches on a later `advanceSurface` call only when the global positive maximum makes the fill loop
  execute and this cell's computed raw increment is nonnegative. The initial production lane enforces
  nonnegative active fields, so the local sign condition holds there; a general diagnosis/timeline
  checkpoint may have a negative local rate and need not attach. The state can also persist through a
  globally stalled zero-rate cycle because that call skips the fill/attachment loop.
  The resume decoder preserves it; changing the solver to eliminate it would change historical
  numerical evolution and is outside this decision;
- stored attached/active/shell counts and hex extents equal an independent recomputation from `a`,
  dimensions, centre, and the `hexPrism` mask; crystal extents and every neighbor count are derived
  by that independent pass and installed rather than accepted from wire values;
- cumulative `holeFillCountTotal <= attachedCount`, because each hole-fill event attaches one
  previously unattached cell at most once. The runner trace/genesis verifier enforces the tighter
  seed-aware recurrence; the core bound prevents a diagnosis-only restore from accepting impossible
  public state;
- `holeFillCountTotal = 0` if and only if `holeFillDeficit` is canonical positive zero. Every
  hole-fill branch increments the count and adds strictly positive `1 - f`, so a positive count
  requires a positive deficit and a positive deficit requires a positive count;
- `boundaryOrder` contains each recomputed unattached active boundary pixel exactly once and no
  other index; `lastAttached` contains distinct in-range attached active indices, and the runner
  additionally requires its exact order to equal the final trace record;
- `tick = 0` if and only if the report is absent. At tick zero `L = 0`, `lastAttached` is empty,
  `holeFillCountTotal = 0`, and scalar slots 0–5—simulation time, monopole rate, maximum velocity,
  and all three ledgers—are canonical positive zero by raw bits; a noncanonical signed zero is
  rejected;
- for a present report, residual and divergence residual are finite, nonnegative, and respectively
  `< relaxTol` and `< divTol`. A zero residual is canonical positive zero because the solver derives
  it from `maxAbs`/`Math.abs` and a positive denominator; divergence residual raw bits must equal the
  independent v6 identity recomputation, which also makes an exact zero canonical positive zero.
  Shell clamp, surface exchange, smoother drift, and minimum local
  exchange diagnostics are finite, and any zero in those four fields is canonical positive zero;
  the **runner generation verifier** independently derives decision
  0014's formula using the R15 outward-rounded input envelope as
  `1024 * activeCellCount * max(Number.EPSILON * maxAbsSweepInputBound, Number.MIN_VALUE)` (or exact
  zero when that input bound is zero), from an independently propagated outward-rounded binary64
  envelope and independently recomputed `activeCellCount`, and rejects
  `abs(smootherDriftDiagnostic)` above it; and
- for v6/monopole, the decoder recomputes
  `abs(shellClamp + smootherDrift - surfaceExchange) / max(abs(surfaceExchange), 1e-300)` using that
  exact JavaScript evaluation order and requires raw-bit equality with the stored divergence
  residual. `lastRelaxationConverged` must equal the conjunction of the two strict tolerance tests,
  not merely be `true` beside failing numbers.

The core solver's tight per-sweep bound uses the pre-replacement maximum input, which this format does
not retain. The production verifier never accepts a producer-supplied scale. It instead scans the
parent generation checkpoint for the maximum active `sigma` value and propagates an independent,
outward-rounded upper envelope through every recorded sweep in execution order. This supersedes ADR
0014 D3's `maxAbsSweepInput = sigmaInfinity` shortcut for R15: that shortcut's exact-arithmetic
maximum-principle premise is not true under the implemented binary64 evaluation order. For example,
the in-plane expression can round a uniform positive field one ulp above its input.

The envelope uses finite nonnegative binary64 only. `upAdd`, `upMul`, and `upDiv` evaluate the named
JavaScript operation once and then apply an integer-bit `nextUp`; any non-finite result rejects the
row. Given input bound `M`, one aggregate-v6 smoother sweep is bounded in the exact solver operation
order by:

```text
pair = upAdd(M, M)
plane = upDiv(upAdd(upAdd(upAdd(M, pair), pair), pair), 7)
verticalPair = upAdd(plane, plane)
smooth = upAdd(upMul(4 / 7, plane), upMul(3 / 14, verticalPair))
mean[c] = upDiv(upAdd repeated c times from +0 with operand smooth, c), c = 1..8
Mnext = max(smooth, mean[1], ..., mean[8], sigmaInfinity)
```

This is deliberately an upper envelope, not a reconstruction of the field. The opposing-vapor mean
has at most eight nonnegative operands; the positive-coefficient aggregate boundary result cannot
exceed that mean because its evaluated denominator is at least one; the shell target is checked
below; and attachment writes zero. For a relaxation with `sweeps = q`, the final reported smoother
drift is checked with the envelope before sweep `q`, and the envelope after sweep `q` feeds the next
trace record. Each generation checkpoint's actual maximum active `sigma` must not exceed the envelope
carried from its parent; the next segment restarts from that independently scanned, tighter maximum.
The same independently derived bound is therefore applied to every trace relaxation record. A
coherently changed smoother drift plus adjusted divergence residual must still fail the absolute
bound check.

The production verifier scans every decoded generation checkpoint and requires each active `sigma`
there to be finite and nonnegative, with canonical positive-zero bits whenever its numeric value is
zero. Between checkpoints, nonnegativity follows from the hash-bound v6
operator's nonnegative smoother operands, positive-coefficient boundary solve, independently checked
nonnegative shell targets, and attachment-to-zero; the trace is not falsely claimed to expose each
intermediate field. Before each traced relaxation the verifier independently recomputes `x0M` and
`vKinMS` from the primitive hash-bound
`tempC`, `pressurePa`, and other run/checkpoint controls in the solver's exact preparation order; they
are not producer-supplied wire scales. It then derives the shared monopole scale and each unblocked
shell target in the exact solver evaluation order:

```text
scale = volumeRateM3PerS / (4 * Math.PI * x0M * vKinMS)
target = sigmaInfinity - scale / shellRadiusM
```

The verifier independently derives `shellRadiusM` from the integer-invariant radius and hash-bound
`dxUm`. Every target must lie in `[+0, sigmaInfinity]`. A negative or overshooting target makes the row
invalid; the verifier does not widen the envelope or fall back to a producer value. A reassociated
single-division expression is not equivalent and is forbidden.

The plan's possible `744³` configuration has 411,830,784 cells. Its three main fields alone occupy
7,001,123,328 bytes (about 6.52 GiB), already larger than a monolithic `Uint8Array` before either
ordered list. Therefore encoding writes bounded chunks directly to the supplied sink while the
runner hashes and persists them; decoding reads bounded chunks directly into the final owned field
arrays. On little-endian hosts, full aligned field chunks may be zero-copy views whose lifetime ends
when the sink write resolves. A big-endian implementation must convert bounded chunks explicitly.

`LK_RESUME_STREAM_CHUNK_BYTES` is exactly 8,388,608 bytes. No production source read or sink write
may exceed it. The preamble and header are separate chunks; payload chunks never cross field
boundaries, `f64` chunks start and end on eight-byte element boundaries, and `u32` chunks start and
end on four-byte element boundaries. `u8` chunks have no additional alignment. A final chunk is
still a whole number of its field's elements. The unit-test-only monolithic adapter has the separate
exact cap `LK_RESUME_TEST_BUFFER_CAP_BYTES = 16,777,216` and rejects a larger declared or observed
stream before concatenation.

`LKSolver.fromResumeStateV3` adopts the decoder-owned `a`, `f`, and `sigma` arrays, or initializes
those exact final arrays directly. It must not run the ordinary allocate-then-copy constructor path.
The environment-neutral decoder derives and validates the final owned topology arrays/witnesses once;
the solver adopts those arrays rather than allocating a duplicate topology and rescanning beside it.
Solver-only scratch/caches are then allocated around the adopted state. Encode is non-mutating, and
decode/restore never has two complete copies of the three main fields or two complete copies of the
restored topology live at once.

Production streaming encode must not copy multi-gigabyte public fields. The production runner therefore owns the
solver exclusively from snapshot creation through the final sink acknowledgement, supplies the only
trusted sink implementation, and runs no user callback while a write is pending. Scalars, reports
and ordered lists are cloned at snapshot start; solver methods carry a mutation epoch checked before
and after awaited writes. Direct hostile mutation through publicly exposed typed arrays is outside
the evidence trust boundary and is prevented operationally by the isolated worker. A callback-based
mutation attempt is a required negative control; the codec does not pretend TypeScript `readonly`
makes a typed array immutable at runtime.

Thus the payload contains:

- full `a`, `f`, and `sigma` fields;
- the exact ordered boundary-cell list and exact ordered `lastAttached` list;
- physical time, the previous-step monopole volume rate, most recent maximum fill velocity, and all
  three fill/hole/clipping ledgers; and
- the complete nullable `lastRelaxation` report.

Its exact canonical JSON header records version/kind/phase, dimensions, tick, every
continuation-relevant physics and numerical control, topology counts, integer counters, null flags,
and exact field descriptors. Initial `seedRadius`/`seedThickness` are not continuation controls and
are not wire fields; the immutable outer run spec binds them so the original case remains explicit.
Canonical bytes are enforced: fatal UTF-8 decoding, exact key sets and order, and byte-for-byte
equality with the validated header's canonical re-encoding. This rejects duplicate/extra/reordered
keys, alternate number spellings, whitespace variants, malformed descriptors, truncation, and
trailing bytes.

For checkpoint, trace, generation record, and pointer, “canonical JSON” means the UTF-8 bytes produced
by `JSON.stringify` with no replacer and no spacing from a newly constructed data-only object whose
properties were inserted in the exact order specified here. Parsed objects, accessors, prototypes,
and input property iteration are never re-used to encode. After semantic validation, the decoder
reconstructs that object and requires its bytes to equal the input exactly.

The decoder's single O(domain) validation pass recomputes and cross-checks the wall mask, active and
shell topology, attached count/extents, neighbor counts, boundary membership, Dirichlet-cell order and
integer-invariant shell radii. The serialized boundary order must be a duplicate-free permutation of
that recomputed boundary set. Those final topology arrays/witnesses enter the single-consume owned
envelope. Internal restore construction runs no seed initializer and no test hook; it adopts those
arrays and the serialized boundary order without a second topology scan. It recomputes only derived
physics/floating caches such as temperature/pressure constants and prepared facet constants around
the adopted state. The decoded `lastAttached` order is retained unchanged for the runner's trace
cross-check. Scratch arrays and nonlinear boundary caches are cleared for the next relaxation.

### 4. Solver resume is not itself campaign evidence

Core remains environment-neutral, so the v3 state envelope does not import Node hashing or filesystem
semantics. The Node runner hash-binds each generation's SHA-256 and parent generation to the immutable
case key; frozen protocol and complete per-case run-spec hashes; exact `process.argv` and
`process.execArgv`; the real path and content hash of `process.execPath`; termination, retry, and
checkpoint-policy identifiers; immutable source snapshot and resolved dependency hashes; the
allow-listed environment; pinned Node/V8/platform identity; a frozen physical-host fingerprint and
independently replayed numerical-engine fingerprint; and the append-only trace prefix. A recovery
attempt for a case remains on the same physical gate host; matching `arch` alone is not continuity
evidence.

The source snapshot must be execution-closed, not merely copied: snapshot-local workspace links point
to the snapshot's own `core` and `solver-cpu`; startup records and verifies `import.meta.resolve`,
realpaths and content hashes for every executed module. It never inherits mutable parent-workspace
package links. Child environment is constructed from a frozen allow-list rather than spread from
`process.env`, and rejects `NODE_OPTIONS`, preload/import hooks and module-shadow paths. The controlled
launcher invokes the worker with exact empty `process.execArgv`; the worker requires that array to
remain empty. Thus `--require`/`-r`, `--import`, `--loader`/`--experimental-loader`, `--conditions`,
policy files, inspector/eval flags, and every other Node execution flag are ineligible rather than
merely recorded. Negative controls launch each code-loading/resolution family and prove that no
generation-zero byte is written. Checkpoint
and trace hashing/decoding use one already-opened source sequentially so path replacement between a
hash pass and a decode pass cannot create a time-of-check/time-of-use gap.

Recording a changed runtime is not permission to continue under it. Across a complete case chain,
every generation—including genesis—must equal the WP3-frozen execution lock and one another for
`sourceSnapshotSha256`, `resolvedDependenciesSha256`, `environmentSha256`, executable realpath/hash,
working-directory realpath, Node/V8/platform/architecture identity,
`physicalHostFingerprintSha256`, `numericalEngineFingerprintSha256`, empty `processExecArgv`, and
all four policy IDs. Both fingerprint digests must equal values in the WP3-frozen execution lock and
must be recomputed from the live host/process by an independently verified preflight; copying an old
record is not a check. `processArgv` may differ only between the exact WP3-frozen fresh and recovery forms;
the recovery form must name the same case and its verified parent generation. Only attempt/recovery
provenance (`attemptId`, `resumedFromGeneration`, and `priorTermination`) may vary freely according to
its own invariants. The exact argv schemas and the manifest field that binds the expected execution
lock are runner-layer inputs deferred to WP3; until they are frozen and reviewed, this paragraph is
a required relation, not an implementable runner acceptance claim.

The retained trace has one wire format, `LKTraceSegmentV1`; stdout is not an alternate trace. A
segment begins with the exact eight ASCII bytes `VCCTRCE1`, a little-endian `uint32` header length,
then a canonical UTF-8 JSON segment header. Both segment and record JSON headers have the exact cap
65,536 bytes and reject zero length. The segment header's exact property order is:

```text
version, traceKind, endianness, recordEncoding, segmentId, startTick, endTick,
recordCount, parentTraceSegmentSha256, parentCheckpointSha256, caseKeySha256
```

The fixed values are `version=1`, `traceKind="lk-cycle-segment"`, `endianness="LE"`, and
`recordEncoding="u32-canonical-json+u32-attachments"`. IDs/ticks/counts are nonnegative safe
integers. Every digest is exactly 64 lowercase hexadecimal characters. Segment zero is the sole
exceptional genesis segment: its id/start/end/count are all zero and both parent digests are 64 zero
digits. For segment `g > 0`, `segmentId` is exactly the parent generation id plus one,
`parentTraceSegmentSha256` equals the complete preceding segment's SHA-256,
`parentCheckpointSha256` equals the parent generation's checkpoint SHA-256, and
`endTick - startTick = recordCount > 0`. The first record's before tick equals `startTick`, the last
record's after tick equals `endTick`, and every adjacent pair is contiguous. Generation `g` binds
this segment to exactly one decoded checkpoint whose tick is `endTick`; for `g > 0`, replay starts
from the previous generation's checkpoint at `startTick` and must end at that current checkpoint.

After the segment header come exactly `recordCount` frames. Each frame is a little-endian `uint32`
record-header length, that many canonical UTF-8 JSON bytes, then the record header's declared
`lastAttached` values as contiguous little-endian `u32`. The record header's exact top-level order is:

```text
version, recordKind, beforeTick, afterTick, beforeTimeSeconds, afterTimeSeconds,
relaxation, surface, attachments, ledgers, solverAfter, morphology, stop
```

Its fixed values are `version=1` and `recordKind="lk-completed-cycle"`. The exact nested property
orders are:

```text
relaxation: sweeps, converged, residual, divergenceResidual, shellClampDiagnostic,
            surfaceExchangeDiagnostic, smootherDriftDiagnostic,
            minLocalSurfaceExchangeDiagnostic
surface:    attachedNow, maxKineticFillIncrement, holeFillCount, deltaTimeSeconds,
            stalled, skippedUnconverged
attachments: name, dtype, length
ledgers:    fillBefore, fillDelta, fillAfter, saturationClippedBefore,
            saturationClippedDelta, saturationClippedAfter, holeDeficitBefore,
            holeDeficitDelta, holeDeficitAfter, holeFillCountBefore,
            holeFillCountDelta, holeFillCountAfter
solverAfter: volumeRateM3PerS, lastMaxFillVelocityMS, boundaryCount
morphology: attachedCount, iExtent, jExtent, kExtent, tExtent, largestExtent,
            aspectRatio, symmetryError, deltaSymmetric, domainContact
stop:       policyId, symmetrySplit, stalled, domainContact, sizeTargetReached,
            stepCapReached, selected
```

`attachments` is exactly `{name:"lastAttached",dtype:"u32",length:surface.attachedNow}`. Each
record has `afterTick = beforeTick + 1`; `skippedUnconverged=false`; and its accepted relaxation and
surface reports satisfy the checkpoint invariants above. The initial exact `policyId` is
`"phase6-r15-cycle-stop-v1"`; its precedence is `symmetry-split`, `stalled`, `domain-contact`,
`size-target`, `step-cap`, then `continue`. `selected` is one of those six strings and the verifier
recomputes it from the five stored predicates plus the hash-bound run spec. Convergence failure has
no completed-cycle record, while protocol/environment identity failures occur outside the solver
cycle; either terminates the worker as invalid without publishing a resume generation. A different
precedence requires a different `policyId` and an accepted protocol change.

Every record except a segment's last record must derive `selected="continue"`. A segment may end in
`"continue"` when it publishes a nonterminal checkpoint generation. Any other selected value is
terminal: it may occur only in the segment's last record, marks that generation as the immutable
terminal chain head, and forbids every later trace record, staged/canonical child generation and
resume attempt for that case key. Terminality is derived from replayed stop predicates, never from a
producer's “final” flag.

Within a segment, each record's before time, ledger values, hole-fill count, occupancy, and boundary
order equal the parent checkpoint or preceding record's after state. The verifier requires raw-bit
equality for `afterTimeSeconds = beforeTimeSeconds + deltaTimeSeconds`. Because the current solver
adds a ledger across many boundary pixels rather than committing one pre-summed step value, each
float64 ledger delta is canonically `after - before` in that exact JavaScript order; replay requires
the stored delta's raw bits to equal that subtraction and requires monotonic before/after values, but
does not invent the generally false inverse claim that `before + (after - before)` must recover every
bit. Integer hole-fill subtraction/addition is exact. Deltas are finite and nonnegative,
`ledgers.holeFillCountDelta === surface.holeFillCount <= surface.attachedNow`, and the ordered
attachment indices are distinct, active, unattached boundary pixels in the shadow pre-step topology. After applying them, every
morphology field and the symmetry-split, domain-contact, size-target, and step-cap predicates must
equal independent recomputation from the shadow occupancy and outer run spec. The verifier ignores
the producer's booleans when deriving the load-bearing stalled predicate. In the initial positive-CFL,
nonnegative-rate scope it derives `stalled` exactly when `deltaTimeSeconds`, the raw-bit time advance,
and `solverAfter.lastMaxFillVelocityMS` are all canonical positive zero; a hole-fill attachment may
still occur. A stalled record also requires canonical positive zero for
`surface.maxKineticFillIncrement`, `ledgers.fillDelta`, `ledgers.saturationClippedDelta`, and
`solverAfter.volumeRateM3PerS`; its kinetic attachment prefix is empty, so
`surface.attachedNow === surface.holeFillCount`. These are exact consequences of the skipped kinetic
loop and nonnegative rates, not producer attestations. A non-stalled record requires all three to be strictly positive and requires raw-bit
equality for the time recurrence. `surface.stalled` and `stop.stalled` must each equal that derived
predicate, and the verifier independently selects precedence from the five derived predicates. The
relaxation record independently repeats the strict tolerance checks and the
exact v6 divergence formula stated above.

The kinetic prefix and hole-fill suffix of `lastAttached` are split by
`surface.holeFillCount`; each must be an order-preserving subsequence of the shadow pre-step
`boundaryOrder`, matching the two solver loops. Every suffix cell must also satisfy the start-of-step
raw topology predicate `nT >= 4 && nZ >= 1`. Replay cannot rederive the unretained kinetic rate/fill
eligibility of the prefix or the hole-fill suffix's additional `f < 1` predicate and does not claim
to. `surface.holeFillCount = 0` requires canonical positive-zero `holeDeficitDelta`. A positive count
does **not** require a positive reported delta: adding a small positive deficit to a large cumulative
binary64 ledger can round to an unchanged value.

Every noninteger trace/report/metric value uses the checkpoint's exact lowercase 16-hex-digit
binary64 encoding; nullable report values use JSON `null`, and every numerical zero in a retained
scalar or report field is canonical positive zero. JSON numbers are used only for safe
integers, and booleans only for predicates. Before/after time, every delta and ledger value,
`maxKineticFillIncrement`, `volumeRateM3PerS`, `lastMaxFillVelocityMS`, aspect ratio, and symmetry
error are finite and nonnegative; morphology counts/extents and attachment/boundary/hole counts are
nonnegative safe integers within the active-cell count; relaxation residuals are finite,
nonnegative, and below their strict tolerances; signed relaxation diagnostics are finite; and
`maxKineticFillIncrement` passes the exact binary64 fill-CFL roundoff bound frozen in the R15 run
spec, apart from the already separately counted hole-fill events. Every extent/aspect/symmetry value
must equal the independent occupancy recomputation, rather than
merely pass a sign check. NaN and infinities are not retained trace values. Canonical
re-encoding must equal every validated header byte for byte. The reader consumes exactly the
declared frame count, rejects a frame or attachment
payload that crosses EOF, and requires its final offset to equal the opened file's exact length.
Before allocating a record attachment array, its count, `4*count`, current offset, and resulting end
offset must all be nonnegative exact safe integers, the count must not exceed the active-cell count,
and the end offset must not exceed the already observed file length.
Duplicate, missing, extra, or reordered keys; malformed or over-cap headers; duplicate or
out-of-order segment IDs/ticks; wrong parent/case digests; trailing bytes; and truncated attachments
all fail closed. Binary attachment payloads use the same 8,388,608-byte maximum read/write chunk;
chunks are four-byte aligned and do not cross a record boundary.

Before any production step, the runner publishes generation zero: the canonical zero-record genesis
segment and a tick-zero v3 checkpoint. Its generation record binds both hashes to the complete
immutable run spec, including seed radius/thickness and parameter set. A separate genesis verifier
reconstructs the active mask, seed occupancy, exact `f`/`sigma`, boundary topology/order, controls,
and zero dynamic state from that run spec without calling the resume constructor. Specifically, seed
sites have `a=1`, exact `f=1`, and canonical positive-zero `sigma`; every other active site has
canonical positive-zero `a`/`f` and the exact `sigmaInfinity` bits; masked walls have canonical zero
fields. It requires exact canonical checkpoint bytes. Generation one therefore replays from a
hash-bound tick-zero state; it does not rely on an absent parent or an informal assumption about how
the seed was made.

The immutable publication record has one exact wire format, `LKGenerationRecordV1`. Its filename is
`generation-<g>.vccgen`, where `<g>` is the generation as exactly sixteen zero-padded decimal digits;
`g` is a nonnegative safe integer and the parsed filename must equal the header value. The bytes are
the exact eight ASCII bytes `VCCGENR1`, a little-endian `uint32` JSON length, then canonical UTF-8 JSON
and EOF. `MAX_LK_GENERATION_RECORD_HEADER_BYTES` is exactly 65,536; zero, a larger length, extra bytes,
or a file whose observed length is not exactly `12 + headerLength` is rejected before publication.
The exact top-level property order is:

```text
version, recordKind, generation, caseKeySha256, runSpec, execution,
parent, trace, checkpoint
```

The fixed values are `version=1` and `recordKind="lk-generation"`. Exact nested property order is:

```text
runSpec:    file, sha256, protocolSha256, parameterTableSha256, evaluatorSha256,
            sourceLockSha256, seedRadius, seedThickness, paramSet
execution:  sourceSnapshotSha256, resolvedDependenciesSha256, environmentSha256,
            executableRealpath, executableSha256, workingDirectoryRealpath,
            nodeVersion, v8Version, platform, arch,
            physicalHostFingerprintSha256, numericalEngineFingerprintSha256,
            processArgv, processExecArgv, terminationPolicyId, retryPolicyId,
            checkpointPolicyId, stopPolicyId, attemptId, resumedFromGeneration,
            priorTermination
parent:     generation, generationRecordFile, generationRecordSha256,
            checkpointSha256, traceSegmentSha256
trace:      file, sha256, segmentId, startTick, endTick, recordCount, byteLength
checkpoint:file, sha256, tick, byteLength
```

Every `sha256` value is exactly 64 lowercase hexadecimal characters. `runSpec.file` is the immutable
canonical `run-spec.v1.json`; `MAX_R15_RUN_SPEC_BYTES` is exactly 65,536, and zero bytes or any larger
observed file fails before JSON parsing. Its retained bytes follow the canonical-JSON rules above,
and its R15-frozen schema contains every physics, numerical, seed, domain, evaluator, and stop control.
The run-spec schema does not contain its own case key. `caseKeySha256` is exactly SHA-256 over the byte
concatenation of the ASCII domain-separation string `VCC-R15-CASE-V1`, one zero byte, and the exact
canonical `run-spec.v1.json` bytes. The verifier parses those bytes, recomputes that digest, and cross-checks every
duplicated control against the checkpoint, trace, and generation record. The five explicit run-spec
digests bind the frozen protocol, current parameter-table revision, evaluator, and source-lock bytes;
the genesis seed and parameter set are duplicated so reconstruction cannot silently read a different
revision. All filenames are single path components with the exact registered spelling and must resolve
as direct-child regular files inside the case directory. Path traversal, symbolic links, junctions and
other reparse-point traversal are forbidden. The publication protocol's explicitly witnessed NTFS
hard links are allowed: they are regular-file directory entries, and the verifier must prove the
opened file identity and bound digest rather than treating link count alone as provenance.

`processArgv` and `processExecArgv` are arrays of strings retained in exact order; no normalization or
sorting is permitted. `executableRealpath` is the resolved `process.execPath`, and its bytes are hashed
once from an already-opened read handle. `workingDirectoryRealpath` is exactly the immutable source
snapshot root. The launcher sets that cwd, passes the case directory and run-spec path as absolute
arguments, and the worker rejects a `process.cwd()` realpath mismatch before generation zero; no
relative CLI, data, config, package, or case path is eligible. The three manifest digests bind canonical retained manifests
for the complete source snapshot, every resolved executed module, and every allow-listed environment
key/value respectively. `physicalHostFingerprintSha256` binds the WP3-frozen canonical hardware
identity manifest used to confine a case to one physical gate host;
`numericalEngineFingerprintSha256` binds exact output bytes from the WP3-frozen live
transcendental/numerical probe. The controlled launcher and an independent verifier recompute both
before generation zero. The hardware fields, probe inputs/outputs, canonical formats, privacy-safe
retained representation, and filenames are WP3 freeze inputs rather than implementation defaults.
`attemptId` is exactly 32 lowercase hexadecimal digits from 16 bytes supplied
by the operating-system cryptographic generator; it is an execution identifier, not a scientific
seed. `resumedFromGeneration` is either `null` or a smaller
nonnegative generation; `priorTermination` is exactly `"none"` for a fresh attempt or
`"process-termination"` for an allowed recovery. The record's exact policy IDs must equal the frozen
R15 protocol.

### Protocol-dependent runner acceptance boundary

The framing and cross-binding design above is not permission to invent the R15 run-spec or campaign
policies during implementation. Before this decision can become accepted for the runner layer, WP3
must freeze, in exact ordered schemas:

- every physics, numerical, seed, domain, physical-size, evaluator and stop field in
  `run-spec.v1.json`, including units, types, bounds and duplicated cross-checks;
- termination, retry, checkpoint-cadence and stop policy values and their exact IDs;
- the environment allow-list, executable/argument restrictions and the exact `symmetrySplit`
  derivation;
- the expected continuation-stable source/dependency/environment/executable/engine execution lock,
  including the same-physical-host and independently verified live numerical-fingerprint fields,
  the exact fresh/recovery `processArgv` forms, and their complete-chain equality relation;
- the retained source-snapshot, resolved-dependency and environment manifest filenames, canonical
  encodings and schemas, plus the host-identity and numerical-fingerprint artifact filenames,
  canonical encodings, probe set and verification procedure; and
- generation cadence, storage preflight, complete-chain retention and the boundary between transient
  multi-gigabyte recovery state and claim-bearing tracked `evidence/` artifacts.

Until those inputs are frozen and independently reviewed, implementation may cover only the
protocol-independent core v3 framing/decoder and solver restore contract. The R15 worker, run-spec
cross-checks, generation publisher and terminal scientific payload remain blocked. This sequencing is
a scientific constraint: implementation-defined defaults would become unregistered inputs to the
campaign they are meant to protect.

Generation zero's five `parent` values are JSON `null`. For `g>0`, `parent.generation=g-1`; the parent
filename and digest identify the complete preceding generation record, and the two parent file hashes
equal that record's checkpoint and trace hashes. Trace and checkpoint filenames are respectively
`trace-<g>.vcctrace` and `checkpoint-<g>.vccckpt` with the same sixteen-digit `<g>`; their IDs/ticks,
lengths, and independently recomputed hashes must match the opened files and the trace/checkpoint
cross-checks above.

The only mutable publication name is `current.vccptr`. Its exact `LKGenerationPointerV1` bytes are the
eight ASCII bytes `VCCPNTR1`, a little-endian `uint32` header length, canonical UTF-8 JSON, and EOF.
`MAX_LK_GENERATION_POINTER_HEADER_BYTES` is exactly 4,096. Its exact key order is:

```text
version, pointerKind, caseKeySha256, generation,
generationRecordFile, generationRecordSha256, publisherAttemptId, recoveryDisposition
```

The fixed values are `version=1` and `pointerKind="lk-current-generation"`. The case key, generation,
exact generation-record filename, and SHA-256 must equal the fully verified record.
`publisherAttemptId` has the same 32-hex syntax as the generation attempt and identifies the process
that replaced the pointer. `recoveryDisposition` is exactly `"direct"`, `"completed-staged"`, or
`"adopted-canonical-orphan"`; it records whether that publisher completed its own transaction,
finished a killed attempt's verified staging transaction, or adopted a fully canonical orphan.
The verifier derives that disposition from the independently observed pre-publication filesystem
state rather than accepting a caller label. For `"direct"`, `publisherAttemptId` exactly equals the
bound generation record's `execution.attemptId`, and that attempt produced and completed its own
transaction. For either recovery disposition, the pointer publisher is the new recovery attempt and
its ID differs from the bound generation producer's ID. `"completed-staged"` requires that recovery
began from the producer's fully verified staged generation record and completed at least one missing
canonical create-if-absent link; `"adopted-canonical-orphan"` requires that all canonical generation
components were already complete and verified but no pointer named them. A valid label with the wrong
attempt relation or observed state is rejected.
Unknown,
missing, duplicate, or reordered keys; wrong magic/version/kind; malformed UTF-8/digest/filename;
zero/over-cap length; truncation; and trailing bytes all fail closed. Thus every head record retains
its digest in the pointer, while every older record retains its digest in its child's parent link.

Canonical checkpoint, trace, and generation files are immutable. A worker first exclusive-creates an
attempt-unique transaction directory
`.staging/attempt-<attemptId>-generation-<g>`; `<g>` uses the same sixteen-digit spelling as the
canonical files. Partial staging directories never occupy a canonical generation name. Publication
uses these ordered process-crash boundaries for every generation, including genesis (whose trace is
the empty canonical segment and whose checkpoint receives the independent genesis reconstruction
check):

1. create the staged trace segment, write all bytes through that still-open handle, call the
   platform file-sync operation while the handle is open, then close it; reopen it exactly once
   read-only, and in one sequential pass feed the same bytes to SHA-256 and the framing parser/replay
   verifier before closing that read handle;
2. stream the staged checkpoint through its still-open handle, sync while open, then close; reopen it
   exactly once read-only, and in one sequential pass feed the same bytes to SHA-256 and the v3
   decoder/cross-check before closing that read handle;
3. exclusive-create the staged generation record binding the final canonical filenames, both verified
   hashes, the parent, and every execution identity above; write and sync while open, close, then
   reopen exactly once and hash/parse/verify it from that single read handle. Only after all three
   staged files verify, publish trace, then checkpoint, then generation record by same-volume
   `fs.link(stagedPath, canonicalPath)`. NTFS hard-link creation is the demonstrated atomic
   create-if-absent primitive: an existing name yields `EEXIST` and is never replaced. The preflight
   proves this behavior on the evidence volume, and the runner syncs the case directory where
   demonstrated after each link. A platform/filesystem without that witnessed contract is
   production-ineligible;
   and
4. exclusive-create a staged `LKGenerationPointerV1`, write and sync it while open, close and
   reopen it exactly once to parse/hash/cross-check its bound generation record, close it, atomically
   replace only `current.vccptr`, and sync the containing directory where the platform exposes a
   demonstrated directory-sync operation.

An already-existing canonical component during publication is acceptable only when the recovery
verifier opens it once and proves its bytes, digest, parse, and cross-links equal the complete staged
transaction; a different valid or invalid component makes the case invalid. It is never overwritten.
Thus a crash cannot leave a partially written canonical file: it leaves either an ignorable partial
attempt-unique staging directory or a prefix of atomically linked complete components plus the
verified staged generation record needed to finish the same transaction.

The preceding valid generation remains retained. An empty case directory—no pointer, canonical
component, or fully verified staged transaction—is the sole fresh state and begins generation zero.
If the pointer is absent but artifacts exist, recovery may reconstruct a head only from exactly one
fully verified, contiguous generation chain beginning at independently reconstructed generation zero;
a verified staged transaction may first be completed as below. Any canonical artifact not belonging
to that unique chain, or more than one possible chain, invalidates the case. A present pointer that
does not pass its framing, canonical, digest, and chain checks is corruption and invalidates the case;
it is never treated as if absent.

With a valid or uniquely reconstructed head, recovery verifies the named record, both files, the
complete parent chain to genesis, and bound trace prefixes. It then enumerates attempt staging
directories and later immutable record filenames. A transaction with a
fully verified staged generation record may have its missing create-if-absent hard links completed; a
partial transaction without a verified record is retained and ignored, and a new attempt draws a new
cryptographic `attemptId` (an `EEXIST` collision retries before writing). A single contiguous newer canonical child whose parent digest is the verified head may be
adopted only after the same validation, recursively. Two valid children of one parent, a valid
noncontiguous generation, a canonical/staged digest conflict, or any other fork invalidates the case
rather than selecting a convenient branch.
This detects accidental/process-crash corruption and replacement inconsistent with the bound chain;
without a committed or external trust anchor it is not cryptographic authentication against a
hostile actor able to replace the entire repository and chain.

If replay derives a terminal selection at the verified head, enumeration must find no staged or
canonical child and the launcher refuses resume. Any child or later record after that terminal state
invalidates the case rather than being adopted as a contiguous generation.

Runner extrema are resume caches, never the sole evidence for themselves. Starting from the bound
parent occupancy, the independent trace reader applies the ordered attachment event log and derives
completed-step count, tick, occupancy, extents, aspect ratio, symmetry, contact, size predicate,
stop precedence, last attachments, and their extrema. It sums exact `dt` values in execution order
and verifies the before/delta/after recurrence for time, each ledger, and hole-fill count; it requires
the final recurrence values, copied monopole lag, maximum fill velocity, last report, and boundary
order to equal the decoded checkpoint and campaign record.

Production replay maintains its own incremental shadow occupancy/topology and updates it from the
ordered attachment events; recomputing every full-domain morphology metric at every record would be
`O(domain × ticks)` and is not an admissible implementation shortcut. WP3 freezes a periodic full-scan
cadence, and every checkpoint boundary plus the terminal record receives a full independent scan that
must equal the incremental state. Tests compare the incremental and full-scan paths after every step
on small adversarial cases.

That is an independent derivation of morphology and arithmetic consistency, not of the historical
kinetic calculation. The trace does **not** retain per-boundary `f`, rate, or boundary-solution inputs,
so `fillDelta`, clipping delta, hole-deficit delta, and `volumeRateM3PerS` remain producer values that
are hash-bound and cross-linked, not physically rederived by replay. Their physical correctness is
established by independent solver property/mutation tests and the uninterrupted/resumed differential,
not by the production trace. A v3 solver checkpoint without its hash-bound campaign/trace binding may
be used for diagnosis, but it is ineligible for a Phase 6 production result. Human-readable text is
derived from the exact record and cannot be replayed as evidence.

Parallel workers use one immutable case key and checkpoint chain per case. There is no shared numeric
“next row” cursor: pending work is the frozen case-key set minus independently hash-verified terminal
case keys.

### 5. Bit-identical continuation is the acceptance criterion

On the WP3-frozen physical gate host, with the pinned Node/V8 oracle and matching independently
verified numerical-engine fingerprint, uninterrupted and resumed executions must produce identical
logical per-step scientific records, terminal solver state, terminal scientific-result payload, and
core final v3 checkpoint bytes. Fields, ordered boundary state, reports, ledgers, and topology are all
part of that comparison. The execution manifests must **differ honestly** when a resume occurred:
generation count, parent links, trace segmentation, interruption, and recovery provenance are never
normalized away. Tests cover monopole matching, v6, noise, attachment, saturation, and hole fill,
and split at multiple cycle boundaries.

Mutation tests independently witness changes to the monopole lag, each ledger, boundary
ordering/membership, last-attachment ordering, nullable report fields, phase, controls, field bytes,
topology witnesses, canonical header, payload lengths, protocol/case/argv/termination/checkpoint
bindings, source/environment/runtime identity, trace prefix, and parent checkpoint chain. The core
decoder rejects schema, topology, range, order-membership, and payload-structure violations. A
structurally valid changed float bit or alternate valid boundary permutation is rejected by the
runner's immutable outer SHA-256 and trace/case binding, not falsely claimed as detectable by a
hash-free core codec. Frozen v1/v2 fixtures remain unchanged and are rejected by the resume API.

### 6. Required acceptance and negative-control coverage

Before production eligibility, tests must establish all of the following:

- frozen GG v1 and LK v1/v2 fixture bytes remain unchanged, and legacy/resume readers reject the
  other version family;
- the shared `RelaxationReport` documentation and every resume eligibility check name smoother-drift
  metering for both aggregate v5 and v6; the corrected operator documentation is retained and a
  regression prevents a v5-only check from returning;
- export refuses every non-boundary phase, every prior accepted environment event, every nonzero
  timeline ledger, every solver whose cumulative `testHookEverUsed` flag is true—including an
  already-consumed or empty `testExtraSeedSites` input—and every configuration outside the initial
  v6 / monopole / hex-prism / float64 scope;
- the v3 decoder/exporter uses the exact Phase 6 parameter-set switch rather than the shared enum;
  direct and multiply resumed differentials cover `CAK`, `M1`, and, before it becomes eligible,
  `M1_NO_DIP_ABLATION`; `CAK_A1`, a fabricated name, and a newly added shared-core value all fail;
- streamed encode/decode survives adversarial chunk boundaries through the fixed header, every
  float64 and uint32 element, and the >4 GiB total-length arithmetic without constructing a
  monolithic buffer; the exact 65,536-byte header cap, 8,388,608-byte stream-chunk cap, element
  alignment, 16,777,216-byte test-adapter cap, safe-integer/header-u32/index-ceiling/`B <= n`/`L <=
  n` checks, and exact source length are all exercised at the boundary and one byte beyond; failures
  occur before large allocation, and a decoded ownership envelope can be consumed exactly once;
  a shallow copy, missing brand and second consume each fail before solver construction;
- independently witnessed reachable-state mutations cover nonbinary `a`, nonfinite/out-of-range
  `f`, noncanonical zero `f`, nonfinite or below-`-1` `sigma`, noncanonical
  attached/wall zeros, active non-boundary partial fill, topology counts,
  `holeFillCountTotal = attachedCount + 1`, zero-count/positive-deficit and
  positive-count/zero-deficit pairs,
  incomplete/extra/duplicate boundary membership, duplicate/nonattached
  `lastAttached`, tick-zero nonzero dynamics, report/tick presence, sweep range, negative-zero in
  each report slot 6–11, residual/divergence
  ranges, converged-flag consistency, exact v6 divergence-identity recomputation, and a coherent
  smoother-drift/divergence mutation whose identity passes but whose absolute drift exceeds the
  independently derived decision 0014 bound; a reachable unattached boundary `f=1` fixture instead
  decodes bit-exactly, persists through a zero-rate cycle, and—with a witnessed nonnegative local
  increment—attaches when a later cycle enters the positive-rate fill/attachment loop;
- the outward-rounded envelope is checked against a hand-evaluated uniform-field witness that exceeds
  `sigmaInfinity` under the actual in-plane/vertical binary64 expressions; production-lane mutations
  cover active checkpoint `sigma` with negative-zero bits, active `sigma` below positive zero, an
  actual checkpoint maximum above the
  independently carried envelope, a drift above the envelope-derived bound with coherently adjusted
  divergence, and an envelope arithmetic overflow;
- a parent/prior `volumeRateM3PerS` that makes any independently derived monopole shell target negative
  or above `sigmaInfinity` fails; a numeric witness distinguishes the solver's two-statement
  `scale`/`target` evaluation from the forbidden reassociated single division, and mutation coverage
  proves that `x0M`, `vKinMS`, and `shellRadiusM` are recomputed from primitive controls rather than
  accepted as outer supplied scales;
- generation zero is independently reconstructed from the frozen seed/run spec and matches its
  canonical tick-zero checkpoint exactly, including fields, topology/order, controls, empty
  `lastAttached`, absent report, and positive-zero dynamic state;
- never-checkpointed, checkpoint-every-cycle, and multiply resumed executions match at several
  split ticks under every production parameter set and under nonzero monopole lag, noise,
  attachment, saturation, and hole fill; checkpoint export itself is non-mutating;
- all subsequent logical step reports, attachment order, fields, boundary order, ledgers, topology,
  and terminal scientific result match exactly on the pinned engine;
- restore adopts the decoded main fields and final topology by identity without first allocating a
  second complete copy; streaming rejects solver-method mutation across an awaited sink write, and
  the isolated trusted-runner ownership rule is pinned;
- independently witnessed structural mutations cover missing/extra/duplicate/reordered header
  keys, bad UTF-8, alternate scalar encodings, descriptor shifts, truncation/extension, invalid or
  duplicate indices, and incomplete boundary membership;
- trace framing tests mutate the magic/version/fixed tags, segment id, start/end/count relation,
  parent trace/checkpoint/case digest, record length, record key order, adjacent ticks, attachment
  descriptor/count/alignment, final byte, and trailing bytes; missing, duplicate, out-of-order,
  truncated, forked, and extra segments/records are each rejected by name; a terminal selection in
  the middle of a segment and any record after a terminal selection are separate mutations;
  prefix/suffix subsequence order, hole-fill raw topology, hole-count-delta equality, and
  zero-count/nonzero-deficit mutations fail, while a positive count with a zero rounded deficit delta
  passes an explicit large-ledger witness;
- stalled-record mutations independently add a kinetic-prefix attachment or make each of
  `maxKineticFillIncrement`, fill delta, clipping delta, and `volumeRateM3PerS` nonzero; every one is
  rejected while an otherwise identical hole-fill-only stalled record passes;
- generation-record and pointer tests mutate each magic, version, fixed kind, zero/maximum/over-cap
  header length, key set/order, canonical encoding, generation/filename relation, case key, every run
  and execution binding, `process.argv`, `process.execArgv`, executable path/hash, working directory,
  attempt IDs, recovery disposition/relation and each allowed-label swap against the independently
  observed state, parent filename/digest, trace/checkpoint filename/hash/length/tick, pointer head filename/hash,
  final byte, and trailing bytes; an empty directory, missing head with a unique genesis chain,
  missing head with ambiguous/extra artifacts, corrupt present head, rollback, partial orphan, valid
  single child, valid fork, and noncontiguous generation each exercise the exact recovery disposition
  above; a staged or canonical child after a replay-derived terminal head is rejected and terminal
  resume is refused;
- independently witnessed outer-binding mutations cover a valid-looking boundary permutation,
  monopole lag, each ledger/report bit, field bit, protocol/case/argv/execArgv/stop/checkpoint binding,
  source/environment/executable/Node/V8/physical-host/numerical-fingerprint identity, trace head,
  case key, generation, and parent;
- process-termination injection before and after every write, open-handle sync, close, one-handle
  read verification, staged-file completion, each create-if-absent hard-link publication, generation-record,
  and pointer-replace boundary—including a partial write and truncation of each staged file—always
  leaves the same case key able to publish that generation from a new attempt or recovers a fully
  verified unique newer transaction; it never selects a partial/forked generation and marks a valid
  fork or canonical digest conflict invalid;
- snapshot-local workspace resolution/realpaths/hashes are verified, mutable parent workspace links
  and inherited preload/module-shadow environment are rejected; `process.execArgv` is exactly empty,
  each named code-loading/resolution flag family and a wrong cwd fail before generation zero, all
  case/run-spec arguments are absolute, and one opened
  sequential source supplies both the retained hash and decode/replay bytes;
- independent trace replay derives tick, occupancy/morphology/extrema, symmetry, contact and stop
  precedence; verifies time/ledger/counter recurrences; and cross-links rather than purporting to
  physically rederive the copied monopole rate, kinetic ledger deltas, maximum velocity and reports;
- one killed-and-resumed child-process integration produces the same scientific payload as an
  uninterrupted child while retaining different, truthful execution provenance.

## Consequences

- **Buys:** process interruption no longer forces a scientifically identical long case to restart;
  monopole history and float64 accumulation order survive exactly; old evidence remains reproducible.
- **Costs:** v3 is larger than v2, must be streamed, restore validation is O(domain), and a
  claim-bearing case must retain the complete append-only checkpoint/trace/generation chain to
  genesis. A future pruning rule requires a separately reviewed trust-anchor decision; retaining only
  the preceding generation is not sufficient under this decision's recovery verifier. Exact cadence
  and transient storage placement freeze in WP3. The solver needs a resume construction path that
  adopts decoded fields without duplicating them. Resume tests compare complete state, not merely
  final morphology.
- **Limits:** this decision does not make v1/v2 resumable, does not authorize timeline resume, does not
  permit a checkpoint during relaxation, and does not make a checkpoint a final evidence artifact.
  It does not authorize migrating an in-progress case to another physical host, even when platform,
  architecture, Node and V8 labels match; cross-host comparisons remain tolerance-bounded controls.
  The publication protocol is required to recover from injected process termination. Power-loss
  durability is not claimed on a platform where directory-sync/durable-rename semantics cannot be
  demonstrated.
- **Failure consequence:** if uninterrupted/resumed equality fails before freeze, Phase 6 production
  does not start. A generation **attempt** that terminates or fails before canonical publication may
  retry only from the preceding verified generation under the frozen retry policy. Once a canonical
  generation or pointer exists, any digest, parse, or cross-link failure invalidates the case and is
  never bypassed by rollback. A near-equal morphology is not sufficient.

## Alternatives considered

- **Restart every interrupted case from zero** — scientifically valid but rejects a safe way to
  preserve expensive deterministic work and makes the full convergence campaign unnecessarily
  fragile.
- **Resume LK v2 with defaulted hidden state** — rejected because zeroing the monopole lag and sorting
  the boundary set demonstrably change the next calculation.
- **Serialize only fields plus the monopole lag** — rejected because boundary order and cumulative
  ledgers still diverge while the final shape can look plausible.
- **Checkpoint an accepted `ready` state** — rejected because the cached nonlinear boundary solution
  would become load-bearing state with a substantially larger integrity-validation surface.
- **Checkpoint inside relaxation immediately** — deferred. It requires scratch parity, cumulative
  sweep-budget semantics, and safe-point tests; cycle boundaries are sufficient to begin the Phase 6
  campaign without making an unverified equivalence claim.
- **Build one checkpoint `Uint8Array` in memory** — rejected because the contemplated `744³` fields
  already exceed 32-bit typed-array length as a combined envelope and copying them would add more
  than 6.5 GiB of avoidable live memory.
- **Put campaign provenance into the core solver wire only** — rejected because source snapshots,
  filesystem publication, environment allow-lists, trace retention, and SHA-256 are runner concerns.
  Keeping the layers separate also prevents the solver from self-attesting the evidence that judges it.

## Review provenance and limits

The initial design review used OpenAI `gpt-5.6-sol` at ultra reasoning. The reviewer inherited the
full task/repository context but did not author the initial ADR draft or existing checkpoint
implementation. It independently inspected decision 0011, the quoted charter clauses, the
surface-operator spec, current v1/v2 codec/tests, the complete mutable LK solver state, runner
execution path, and active Phase 6 plan. It independently recomputed the `744³` payload lower bound
and found the original monolithic design impossible, plus missing runtime/protocol binding,
signed-zero, process-crash publication, timeline, provenance-identity, and production-timing
requirements.

An earlier narrow recheck was recorded as clean. A later adversarial audit, also by context-sharing
OpenAI `gpt-5.6-sol` at ultra reasoning, disproved that verdict without executing code: generation
one had no bound genesis; trace framing was unspecified; copied kinetic quantities were described as
independently derived; reachable-state checks, the cumulative consumed-test-hook witness, exact
buffer caps/alignment, and all-production-parameter-set coverage were incomplete; and publication
closed handles before its stated flush. The design was revised to address those findings.

The next design recheck used OpenAI `gpt-5.6-sol` at ultra reasoning. The reviewer was a non-author,
shared the full repository/chat context, and read all 929 lines of the technical candidate at SHA-256
`1dba3ec95dc55898b64a52e669aaa15b28b15999707db728669246ade3b812c6`. It independently checked the
`744³`/three-field memory arithmetic, binary64 maximum-principle counterexample and outward-rounded
envelope, v6 smoother ordering, exact two-statement monopole update, `f=1` and signed-zero
reachability, generation/pointer crash recovery, and independent stop derivation against the current
charter, solver spec, state and publication paths. It reported no remaining design blocker. **That
verdict is superseded by the implementation-readiness audit below and must not be cited as acceptance.**

The implementation-readiness audit used a separate OpenAI `gpt-5.6-sol` at ultra reasoning, non-author
with full shared context. It independently read the governing handoff, lessons, progress, active plan,
this decision, relevant charter/spec clauses, the v1/v2 checkpoint codec/tests, solver implementation,
runner paths, metrics, package exports and evidence rules. It found the science-critical reachable
`f=1` contradiction corrected above, the incomplete WP3-dependent run-spec/manifest/policy contract,
and the complete-chain retention inconsistency corrected above. It also mapped the smallest safe
implementation sequence and required negative controls. This was static read-only inspection: it did
not execute tests, large-memory trials, crash injection, filesystem durability experiments, resumed
differentials or production runs.

The corrected core-design re-review used OpenAI `gpt-5.6-sol` at ultra reasoning, non-author with
full shared context. It reviewed the exact 1,095-line / 80,760-byte pre-review-record candidate at SHA-256
`b9bfec3708b8ef04feed040a8c02d1cda54187dee90f990bb49d74355d33b69f`; independently read the ADR,
active state/plan, LK solver/checkpoint/operator, solver spec and charter; static-traced the reachable
`f=1` paths and complete-chain recovery; reproduced a small binary64 witness; and ran
`git diff --check`. It reported 0 blockers and 0 core should-fixes. It did not run `npm test`, an
implementation, streaming/large-memory/crash/durability experiments, resumed differentials,
production, GPU, held-out, or literature validation. This verdict clears only the
protocol-independent core design. It does not accept the WP3-dependent runner layer.

The protocol-independent core implementation landed through commits `557d1de`, `c595b55`, and
`a1d540c`. It provides the streamed v3 codec, exact structural/state validation, one-use decoded
ownership, and field-adopting float64 CPU restore. Direct, checkpoint-every-cycle, and multiply
resumed CAK/M1 executions now match in complete reports, state, topology/order, ledgers, and encoded
bytes. The durable converged multi-sweep witness is deliberately test-only and non-transferable:
12×12×9, −5 °C, 0.35 µm, nine cycles, 34–75 accepted sweeps/cycle, both sweep parities, noise,
nonzero monopole lag, attachment, clipping, an M1 hole fill at cycle 8, and exact continuation after
restoring that state through cycle 9. Exact `npm.cmd test` at `a1d540c` exited 0 in 735.3 seconds:
Rule 7 clean over 419 files, both TypeScript projects green, and 81 Vitest files / 1,442 tests passed
in 725.30 seconds.

Two final read-only non-author implementation reviews used OpenAI `gpt-5.6-sol` at ultra reasoning
with full shared context. The codec reviewer independently reproduced the pre-fix fact that
zero-radius monopole states encoded successfully and then failed decode, checked the repair's call
order, exhaustively classified 3,375 small domain/centre combinations, and ran the 22-test core
suite, both typechecks, Rule 7, and diff checks; it reported 0 blockers and 0 should-fixes. The
continuation reviewer independently ran the 16-test solver suite plus feature/noise probes and
reported no blocker. Its one scope-label should-fix—replace “realistic” with “converged” and record
the witness as non-transferable—is incorporated. Neither review tested production-size memory,
hostile mutation beyond the registered trust boundary, runner crash recovery, R15, GPU, held-out
science, or a clean clone.

The decision therefore remains proposed. The core work above authorizes no Phase 6 production use.
No trace parser, production streaming-throughput or large-array restore result, runner generation
publisher, process-termination injection, R15 production row, GPU comparison, or held-out comparison
exists for this unit. The exact runner run-spec, generation, publication, retry, cadence, retention,
trace-replay, and crash-recovery contract remains deferred until WP3 freezes and independently
reviews its scientific inputs. Every applicable named negative control still requires a separate
non-author code and execution review before this decision can authorize production use.
