// Independent binary32 replay for the Phase 5 WP4 evidence executable.
//
// This module deliberately does not import solver-gpu. It derives every load-bearing
// relaxation and surface predicate from raw readback arrays plus frozen fixture controls.

const F32_MAX = 3.4028234663852886e38;
const F32_MIN_NORMAL = 1.1754943508222875e-38;
const F32_EPSILON = 2 ** -23;
const TOPOLOGY_FAR_FIELD = 1;
const TOPOLOGY_BOUNDARY = 2;
const TOPOLOGY_KINETIC_ATTACH = 4;
const TOPOLOGY_HOLE_ATTACH = 8;
const TOPOLOGY_TRANSIENT = TOPOLOGY_KINETIC_ATTACH | TOPOLOGY_HOLE_ATTACH;
const RENDER_BOUNDARY = 1;
const RENDER_ATTACH_DECISION = 2;
const RENDER_HOLE_FILL = 4;
const RENDER_ATTACHED_NOW = 8;
const RENDER_NT_SHIFT = 8;
const RENDER_NZ_SHIFT = 12;
const WORKGROUP_SIZE = 256;

const f32 = Math.fround;

function coordinates(index, dims) {
  const plane = dims.nx * dims.ny;
  const k = Math.floor(index / plane);
  const remainder = index - k * plane;
  const j = Math.floor(remainder / dims.nx);
  return [remainder - j * dims.nx, j, k];
}

function neighborIndices(index, dims) {
  const [i, j, k] = coordinates(index, dims);
  const plane = dims.nx * dims.ny;
  const output = [];
  if (i + 1 < dims.nx) output.push(index + 1);
  if (i > 0) output.push(index - 1);
  if (j + 1 < dims.ny) output.push(index + dims.nx);
  if (j > 0) output.push(index - dims.nx);
  if (i + 1 < dims.nx && j > 0) output.push(index + 1 - dims.nx);
  if (i > 0 && j + 1 < dims.ny) output.push(index - 1 + dims.nx);
  if (k + 1 < dims.nz) output.push(index + plane);
  if (k > 0) output.push(index - plane);
  return output;
}

function neighborCounts(index, occupancy, dims) {
  const [i, j, k] = coordinates(index, dims);
  const plane = dims.nx * dims.ny;
  let nT = 0;
  let nZ = 0;
  if (i + 1 < dims.nx && occupancy[index + 1] !== 0) nT++;
  if (i > 0 && occupancy[index - 1] !== 0) nT++;
  if (j + 1 < dims.ny && occupancy[index + dims.nx] !== 0) nT++;
  if (j > 0 && occupancy[index - dims.nx] !== 0) nT++;
  if (
    i + 1 < dims.nx &&
    j > 0 &&
    occupancy[index + 1 - dims.nx] !== 0
  ) {
    nT++;
  }
  if (
    i > 0 &&
    j + 1 < dims.ny &&
    occupancy[index - 1 + dims.nx] !== 0
  ) {
    nT++;
  }
  if (k + 1 < dims.nz && occupancy[index + plane] !== 0) nZ++;
  if (k > 0 && occupancy[index - plane] !== 0) nZ++;
  return [nT, nZ];
}

function reduce(valuesInput, mode) {
  let values = Float32Array.from(valuesInput, f32);
  if (values.length === 0) {
    return mode === "min" ? F32_MAX : mode === "max" ? -F32_MAX : 0;
  }
  while (values.length > 1) {
    const output = new Float32Array(Math.ceil(values.length / WORKGROUP_SIZE));
    for (let group = 0; group < output.length; group++) {
      const local = new Float32Array(WORKGROUP_SIZE);
      const neutral = mode === "min" ? F32_MAX : mode === "max" ? -F32_MAX : 0;
      local.fill(neutral);
      const base = group * WORKGROUP_SIZE;
      const count = Math.min(WORKGROUP_SIZE, values.length - base);
      local.set(values.subarray(base, base + count));
      for (let stride = WORKGROUP_SIZE / 2; stride >= 1; stride /= 2) {
        for (let index = 0; index < stride; index++) {
          if (mode === "sum") {
            local[index] = f32(local[index] + local[index + stride]);
          } else if (mode === "max") {
            local[index] = Math.max(local[index], local[index + stride]);
          } else {
            local[index] = Math.min(local[index], local[index + stride]);
          }
        }
      }
      output[group] = local[0];
    }
    values = output;
  }
  return values[0];
}

export function changedSumReduction(valuesInput, frozenValue) {
  const values = Float32Array.from(valuesInput, f32);
  const orders = [
    { id: "reverse-sequential", values: Array.from(values).reverse() },
    {
      id: "rotated-sequential",
      values: [
        ...values.subarray(1),
        ...(values.length === 0 ? [] : [values[0]]),
      ],
    },
  ];
  for (const order of orders) {
    let sum = 0;
    for (const value of order.values) sum = f32(sum + value);
    if (!Object.is(sum, frozenValue)) {
      return {
        id: order.id,
        value: sum,
        inputCount: values.length,
      };
    }
  }
  const reversedTree = reduce(Array.from(values).reverse(), "sum");
  return Object.is(reversedTree, frozenValue)
    ? null
    : {
        id: "reverse-frozen-tree",
        value: reversedTree,
        inputCount: values.length,
      };
}

function reflectedValue(source, occupancy, wall, own, candidate) {
  return candidate === null ||
    occupancy[candidate] !== 0 ||
    wall[candidate] !== 0
    ? own
    : source[candidate];
}

function diffuse(source, occupancy, wall, dims) {
  const lateralField = new Float32Array(source.length);
  const output = new Float32Array(source.length);
  const driftTerms = new Float32Array(source.length);
  const inputMagnitudes = new Float32Array(source.length);
  for (let index = 0; index < source.length; index++) {
    if (occupancy[index] !== 0 || wall[index] !== 0) continue;
    const [i, j, k] = coordinates(index, dims);
    const own = source[index];
    const east = reflectedValue(
      source,
      occupancy,
      wall,
      own,
      i + 1 < dims.nx ? index + 1 : null,
    );
    const west = reflectedValue(
      source,
      occupancy,
      wall,
      own,
      i > 0 ? index - 1 : null,
    );
    const northEast = reflectedValue(
      source,
      occupancy,
      wall,
      own,
      j + 1 < dims.ny ? index + dims.nx : null,
    );
    const southWest = reflectedValue(
      source,
      occupancy,
      wall,
      own,
      j > 0 ? index - dims.nx : null,
    );
    const southEast = reflectedValue(
      source,
      occupancy,
      wall,
      own,
      i + 1 < dims.nx && j > 0 ? index + 1 - dims.nx : null,
    );
    const northWest = reflectedValue(
      source,
      occupancy,
      wall,
      own,
      i > 0 && j + 1 < dims.ny ? index - 1 + dims.nx : null,
    );
    const pairs = [
      f32(east + west),
      f32(northEast + southWest),
      f32(southEast + northWest),
    ].sort((left, right) => left - right);
    let lateral = f32(own + pairs[0]);
    lateral = f32(lateral + pairs[1]);
    lateral = f32(lateral + pairs[2]);
    lateralField[index] = f32(lateral / 7);
  }
  const plane = dims.nx * dims.ny;
  for (let index = 0; index < source.length; index++) {
    if (occupancy[index] !== 0 || wall[index] !== 0) continue;
    const [, , k] = coordinates(index, dims);
    const own = lateralField[index];
    const up = reflectedValue(
      lateralField,
      occupancy,
      wall,
      own,
      k + 1 < dims.nz ? index + plane : null,
    );
    const down = reflectedValue(
      lateralField,
      occupancy,
      wall,
      own,
      k > 0 ? index - plane : null,
    );
    const verticalSum = f32(up + down);
    const verticalProduct = f32(f32(3 / 14) * verticalSum);
    const lateralProduct = f32(f32(4 / 7) * own);
    const candidate = f32(lateralProduct + verticalProduct);
    output[index] = candidate;
    driftTerms[index] = f32(candidate - source[index]);
    inputMagnitudes[index] = Math.abs(source[index]);
  }
  return {
    output,
    smootherDrift: reduce(driftTerms, "sum"),
    maxAbsSweepInput: reduce(inputMagnitudes, "max"),
  };
}

function opposingSupersaturation(index, smoother, occupancy, wall, dims) {
  const [i, j, k] = coordinates(index, dims);
  const plane = dims.nx * dims.ny;
  const pairs = [
    [i + 1 < dims.nx ? index + 1 : null, i > 0 ? index - 1 : null],
    [i > 0 ? index - 1 : null, i + 1 < dims.nx ? index + 1 : null],
    [
      j + 1 < dims.ny ? index + dims.nx : null,
      j > 0 ? index - dims.nx : null,
    ],
    [
      j > 0 ? index - dims.nx : null,
      j + 1 < dims.ny ? index + dims.nx : null,
    ],
    [
      i + 1 < dims.nx && j > 0 ? index + 1 - dims.nx : null,
      i > 0 && j + 1 < dims.ny ? index - 1 + dims.nx : null,
    ],
    [
      i > 0 && j + 1 < dims.ny ? index - 1 + dims.nx : null,
      i + 1 < dims.nx && j > 0 ? index + 1 - dims.nx : null,
    ],
    [
      k + 1 < dims.nz ? index + plane : null,
      k > 0 ? index - plane : null,
    ],
    [
      k > 0 ? index - plane : null,
      k + 1 < dims.nz ? index + plane : null,
    ],
  ];
  let sum = 0;
  let count = 0;
  for (const [attached, opposite] of pairs) {
    if (
      attached !== null &&
      opposite !== null &&
      occupancy[attached] !== 0 &&
      occupancy[opposite] === 0 &&
      wall[opposite] === 0
    ) {
      sum = f32(sum + smoother[opposite]);
      count++;
    }
  }
  return count === 0 ? 0 : f32(sum / f32(count));
}

function facetOf(nT, nZ) {
  if (nT === 1 && nZ === 0) return "inhibited";
  if (nT === 0 && nZ > 0) return "basal";
  if (nT === 2 && nZ === 0) return "prism";
  return "rough";
}

function attachmentCoefficient(
  core,
  facet,
  tempC,
  sigmaSurfaceInput,
  rngSeed,
  cellIndex,
  tick,
  noiseEpsilon,
) {
  const sigmaSurface = f32(sigmaSurfaceInput);
  if (sigmaSurface <= 0 || facet === "inhibited") return 0;
  let coefficient;
  if (facet === "rough") {
    coefficient = 1;
  } else {
    const prefactor = f32(
      facet === "basal"
        ? core.nucleationABasal(tempC, "CAK_A1")
        : core.nucleationAPrism(tempC, "CAK_A1"),
    );
    const sigma0 = f32(
      facet === "basal"
        ? core.sigma0Basal(tempC)
        : core.sigma0Prism(tempC),
    );
    const exponent = f32(-f32(sigma0 / sigmaSurface));
    coefficient = f32(prefactor * f32(Math.exp(exponent)));
  }
  if (noiseEpsilon > 0) {
    const bit = core.randomBit(
      rngSeed,
      cellIndex,
      tick,
      core.STREAM_NOISE_ALPHA_HK,
    );
    coefficient = f32(
      coefficient * f32(1 - f32(f32(noiseEpsilon) * f32(bit))),
    );
  }
  return coefficient;
}

function solveBoundary(
  core,
  index,
  sigmaOppInput,
  occupancy,
  dims,
  controls,
) {
  const sigmaOpp = f32(sigmaOppInput);
  if (sigmaOpp <= 0) {
    return { coefficient: 0, sigmaBoundary: sigmaOpp };
  }
  const [nT, nZ] = neighborCounts(index, occupancy, dims);
  const facet = facetOf(nT, nZ);
  const coefficientAt = (value) =>
    attachmentCoefficient(
      core,
      facet,
      controls.tempC,
      value,
      controls.rngSeed,
      index,
      controls.tick,
      controls.noiseEpsilon,
    );
  let iterate = sigmaOpp;
  for (let iteration = 0; iteration < 60; iteration++) {
    const coefficient = coefficientAt(iterate);
    const denominator = f32(
      1 + f32(coefficient * f32(controls.dxOverX0)),
    );
    const next = f32(sigmaOpp / denominator);
    iterate = f32(f32(0.5) * f32(iterate + next));
  }
  const coefficient = coefficientAt(iterate);
  const denominator = f32(
    1 + f32(coefficient * f32(controls.dxOverX0)),
  );
  return {
    coefficient,
    sigmaBoundary: f32(sigmaOpp / denominator),
  };
}

function activeCellCount(occupancy, wall) {
  let count = 0;
  for (let index = 0; index < occupancy.length; index++) {
    if (occupancy[index] === 0 && wall[index] === 0) count++;
  }
  return count;
}

export function reconstructBoundary(occupancy, wall, dims) {
  const boundary = [];
  for (let index = 0; index < occupancy.length; index++) {
    if (occupancy[index] !== 0 || wall[index] !== 0) continue;
    if (
      neighborIndices(index, dims).some(
        (neighbor) => occupancy[neighbor] !== 0,
      )
    ) {
      boundary.push(index);
    }
  }
  return Uint32Array.from(boundary);
}

export function replayRelaxationPhase(
  core,
  protocol,
  source,
  observedOutput,
  state,
  fixture,
  tick,
  diagnosticBoundarySigma = null,
) {
  const smoother = diffuse(source, state.occupancy, state.wall, fixture.dims);
  const predicted = Float32Array.from(smoother.output);
  const coefficient = new Float32Array(source.length);
  const boundarySigma = new Float32Array(source.length);
  const opposing = new Float32Array(source.length);
  const exchangeTerms = new Float32Array(source.length);
  const minimumTerms = new Float32Array(source.length);
  minimumTerms.fill(F32_MAX);
  const dxOverX0 = f32(
    (fixture.dxUm * 1e-6) /
      core.kineticLength(fixture.tempC, fixture.pressurePa),
  );
  const controls = {
    tempC: fixture.tempC,
    rngSeed: fixture.rngSeed,
    tick,
    noiseEpsilon: fixture.noiseEpsilon,
    dxOverX0,
  };
  const boundary = reconstructBoundary(
    state.occupancy,
    state.wall,
    fixture.dims,
  );
  for (const index of boundary) {
    const sigmaOpp = opposingSupersaturation(
      index,
      smoother.output,
      state.occupancy,
      state.wall,
      fixture.dims,
    );
    const solved = solveBoundary(
      core,
      index,
      sigmaOpp,
      state.occupancy,
      fixture.dims,
      controls,
    );
    opposing[index] = sigmaOpp;
    coefficient[index] = solved.coefficient;
    boundarySigma[index] = solved.sigmaBoundary;
    const diagnosticSigma =
      diagnosticBoundarySigma === null
        ? solved.sigmaBoundary
        : diagnosticBoundarySigma[index];
    const exchange = f32(smoother.output[index] - diagnosticSigma);
    exchangeTerms[index] = exchange;
    minimumTerms[index] = exchange;
    predicted[index] = solved.sigmaBoundary;
  }
  const surfaceExchange = reduce(exchangeTerms, "sum");
  const minLocalSurfaceExchange =
    boundary.length === 0 ? 0 : reduce(minimumTerms, "min");
  const shellTerms = new Float32Array(source.length);
  if (fixture.farField === "dirichlet") {
    const target = f32(fixture.sigmaInfinity);
    for (let index = 0; index < source.length; index++) {
      if (
        state.occupancy[index] === 0 &&
        state.wall[index] === 0 &&
        (state.topology[index] & TOPOLOGY_FAR_FIELD) !== 0
      ) {
        shellTerms[index] = f32(target - predicted[index]);
        predicted[index] = target;
      }
    }
  }
  const shellInjection = reduce(shellTerms, "sum");
  const residualTerms = new Float32Array(source.length);
  let maximumCurrentStepUlpDistance = 0;
  for (let index = 0; index < source.length; index++) {
    if (state.occupancy[index] !== 0 || state.wall[index] !== 0) continue;
    residualTerms[index] = Math.abs(
      f32(observedOutput[index] - source[index]),
    );
    maximumCurrentStepUlpDistance = Math.max(
      maximumCurrentStepUlpDistance,
      protocol.phase5Float32UlpDistance(source[index], observedOutput[index]),
    );
  }
  const residualMaximum = reduce(residualTerms, "max");
  const residual = f32(residualMaximum / f32(fixture.sigmaInfinity));
  let divergenceResidual = null;
  let divergenceStatus = "not-applicable";
  if (fixture.farField === "dirichlet") {
    const corrected = f32(
      f32(f32(shellInjection) + f32(smoother.smootherDrift)) -
        f32(surfaceExchange),
    );
    if (surfaceExchange === 0) {
      if (corrected === 0) {
        divergenceResidual = 0;
        divergenceStatus = "finite";
      } else {
        divergenceResidual = Infinity;
        divergenceStatus = "zero-exchange-unconverged";
      }
    } else {
      divergenceResidual = f32(
        Math.abs(corrected) / Math.abs(surfaceExchange),
      );
      divergenceStatus = "finite";
    }
  }
  const count = activeCellCount(state.occupancy, state.wall);
  const smootherDriftLimit = protocol.float32SmootherDriftAbsLimit(
    count,
    smoother.maxAbsSweepInput,
  );
  return {
    predicted,
    boundary,
    coefficient,
    boundarySigma,
    opposing,
    residual,
    divergenceResidual,
    divergenceStatus,
    shellInjection:
      fixture.farField === "dirichlet" ? shellInjection : null,
    surfaceExchange,
    smootherDrift: smoother.smootherDrift,
    minLocalSurfaceExchange,
    maxAbsSweepInput: smoother.maxAbsSweepInput,
    smootherDriftLimit,
    driftBoundPassed:
      Math.abs(smoother.smootherDrift) <= smootherDriftLimit,
    maximumCurrentStepUlpDistance,
    activeCellCount: count,
    exchangeTerms,
  };
}

export function independentlyClassifyRelaxation(
  protocol,
  fixture,
  report,
  state,
  currentPhase,
  previousPhase,
) {
  let maximumCurrentStepUlpDistance = 0;
  let maximumTwoBackUlpDistance = 0;
  for (let index = 0; index < state.sigma.length; index++) {
    if (state.occupancy[index] !== 0 || state.wall[index] !== 0) continue;
    maximumCurrentStepUlpDistance = Math.max(
      maximumCurrentStepUlpDistance,
      protocol.phase5Float32UlpDistance(
        state.previousSigma[index],
        state.sigma[index],
      ),
    );
    maximumTwoBackUlpDistance = Math.max(
      maximumTwoBackUlpDistance,
      protocol.phase5Float32UlpDistance(
        state.cycleReference[index],
        state.sigma[index],
      ),
    );
  }
  const classifierInput = {
    residual: currentPhase.residual,
    relaxTol: fixture.relaxTol,
    farField: fixture.farField,
    divTol: fixture.divTol,
    currentDivergenceStatus: currentPhase.divergenceStatus,
    currentDivergenceResidual: currentPhase.divergenceResidual,
    previousDivergenceStatus:
      previousPhase?.divergenceStatus ?? report.previousDivergenceStatus,
    previousDivergenceResidual:
      previousPhase?.divergenceResidual ?? report.previousDivergenceResidual,
    completedSweepsAfterMutation: report.completedSweepsAfterMutation,
    maximumCurrentStepUlpDistance,
    maximumTwoBackUlpDistance,
    currentDriftBoundPassed: currentPhase.driftBoundPassed,
    previousDriftBoundPassed:
      previousPhase?.driftBoundPassed ??
      report.previousPhaseDriftTrace !== null,
  };
  return {
    classifierInput,
    classified: protocol.classifyPhase5LkF32Convergence(classifierInput),
    maximumCurrentStepUlpDistance,
    maximumTwoBackUlpDistance,
  };
}

function expectedRenderFlags(occupancy, topology, dims, decisionFlags) {
  const output = new Uint32Array(occupancy.length);
  for (let index = 0; index < occupancy.length; index++) {
    const [nT, nZ] = neighborCounts(index, occupancy, dims);
    const retained = decisionFlags[index] &
      (RENDER_ATTACH_DECISION | RENDER_HOLE_FILL | RENDER_ATTACHED_NOW);
    if (occupancy[index] !== 0) {
      output[index] =
        retained | (nT << RENDER_NT_SHIFT) | (nZ << RENDER_NZ_SHIFT);
    } else if ((topology[index] & TOPOLOGY_BOUNDARY) !== 0) {
      output[index] =
        RENDER_BOUNDARY |
        (nT << RENDER_NT_SHIFT) |
        (nZ << RENDER_NZ_SHIFT);
    }
  }
  return output;
}

export function replaySurface(
  readyState,
  fixture,
  vKinMSInput,
  attachedTotalBefore,
) {
  const count = readyState.fill.length;
  const rate = new Float32Array(count);
  const vKinOverDx = f32(vKinMSInput / (fixture.dxUm * 1e-6));
  for (let index = 0; index < count; index++) {
    if ((readyState.topology[index] & TOPOLOGY_BOUNDARY) === 0) continue;
    rate[index] = f32(
      f32(
        readyState.boundaryAttachmentCoefficient[index] * vKinOverDx,
      ) * readyState.boundarySupersaturation[index],
    );
  }
  const maxRate = reduce(rate, "max");
  const deltaTimeSeconds =
    maxRate > 0 ? f32(f32(fixture.cflFill) / maxRate) : 0;
  const rawDemand = new Float32Array(count);
  const placed = new Float32Array(count);
  const clipped = new Float32Array(count);
  const partition = new Float32Array(count);
  const holeDeficit = new Float32Array(count);
  const kinetic = [];
  const hole = [];
  const decisionFlags = new Uint32Array(count);
  const fill = Float32Array.from(readyState.fill);
  const occupancy = Uint32Array.from(readyState.occupancy);
  const topology = Uint32Array.from(
    readyState.topology,
    (value) => value & ~TOPOLOGY_TRANSIENT,
  );
  const sigma = Float32Array.from(readyState.sigma);
  for (const index of readyState.boundaryIndices) {
    const raw = f32(rate[index] * deltaTimeSeconds);
    const capacity = f32(1 - fill[index]);
    const applied = Math.min(raw, Math.max(0, capacity));
    const excess = f32(raw - applied);
    const splitError = f32(f32(applied + excess) - raw);
    rawDemand[index] = raw;
    placed[index] = applied;
    clipped[index] = excess;
    partition[index] = splitError;
    let updated = f32(fill[index] + applied);
    const [nT, nZ] = neighborCounts(index, occupancy, fixture.dims);
    if (updated >= 1) {
      updated = 1;
      topology[index] |= TOPOLOGY_KINETIC_ATTACH;
      decisionFlags[index] =
        RENDER_BOUNDARY | RENDER_ATTACH_DECISION |
        (nT << RENDER_NT_SHIFT) | (nZ << RENDER_NZ_SHIFT);
      kinetic.push(index);
    } else if (nT >= 4 && nZ >= 1) {
      holeDeficit[index] = f32(1 - updated);
      updated = 1;
      topology[index] |= TOPOLOGY_HOLE_ATTACH;
      decisionFlags[index] =
        RENDER_BOUNDARY | RENDER_ATTACH_DECISION | RENDER_HOLE_FILL |
        (nT << RENDER_NT_SHIFT) | (nZ << RENDER_NZ_SHIFT);
      hole.push(index);
    } else {
      decisionFlags[index] =
        RENDER_BOUNDARY |
        (nT << RENDER_NT_SHIFT) |
        (nZ << RENDER_NZ_SHIFT);
    }
    fill[index] = updated;
  }
  const survivingBoundary = [];
  for (const index of readyState.boundaryIndices) {
    if ((topology[index] & TOPOLOGY_TRANSIENT) === 0) {
      survivingBoundary.push(index);
    }
  }
  const attachments = [...kinetic, ...hole];
  for (const index of attachments) {
    const isHole = (topology[index] & TOPOLOGY_HOLE_ATTACH) !== 0;
    occupancy[index] = 1;
    sigma[index] = 0;
    topology[index] &= ~(TOPOLOGY_BOUNDARY | TOPOLOGY_TRANSIENT);
    decisionFlags[index] |= RENDER_ATTACHED_NOW;
    if (isHole) decisionFlags[index] |= RENDER_HOLE_FILL;
  }
  const boundary = [...survivingBoundary];
  const freshBoundary = [];
  for (const attached of attachments) {
    for (const index of neighborIndices(attached, fixture.dims)) {
      if (
        occupancy[index] === 0 &&
        readyState.wall[index] === 0 &&
        (topology[index] & TOPOLOGY_BOUNDARY) === 0
      ) {
        topology[index] |= TOPOLOGY_BOUNDARY;
        boundary.push(index);
        freshBoundary.push(index);
      }
    }
  }
  const renderFlags = expectedRenderFlags(
    occupancy,
    topology,
    fixture.dims,
    decisionFlags,
  );
  let minimumDecisionMargin = Infinity;
  for (const index of readyState.boundaryIndices) {
    minimumDecisionMargin = Math.min(
      minimumDecisionMargin,
      Math.abs(1 - f32(readyState.fill[index] + rawDemand[index])),
    );
  }
  return {
    report: {
      attachedNow: attachments.length,
      maxKineticFillIncrement: reduce(rawDemand, "max"),
      holeFillCount: hole.length,
      deltaTimeSeconds,
      stalled: maxRate <= 0,
      skippedUnconverged: false,
      kineticDemand: reduce(rawDemand, "sum"),
      placedFill: reduce(placed, "sum"),
      saturationClippedFill: reduce(clipped, "sum"),
      partitionError: reduce(partition, "sum"),
      holeFillDeficit: reduce(holeDeficit, "sum"),
    },
    maxRate,
    lastMaxFillVelocityMS: f32(maxRate * f32(fixture.dxUm * 1e-6)),
    fill,
    sigma,
    wall: Uint32Array.from(readyState.wall),
    occupancy,
    topology,
    boundaryIndices: Uint32Array.from(boundary),
    freshBoundaryIndices: Uint32Array.from(freshBoundary),
    attachmentIndices: Uint32Array.from(attachments),
    renderFlags,
    attachedTotalAfter: attachedTotalBefore + attachments.length,
    minimumDecisionMargin,
    rawDemand,
    placed,
    clipped,
    partition,
    holeDeficit,
  };
}

export function mutateAndReject(evaluator, value, mutations) {
  return mutations.map(({ id, mutate }) => {
    const candidate = structuredClone(value);
    mutate(candidate);
    let rejected = false;
    try {
      rejected = evaluator(candidate) === false;
    } catch {
      rejected = true;
    }
    return { id, rejected, pass: rejected };
  });
}
