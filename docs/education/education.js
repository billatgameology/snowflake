const lessonCards = document.querySelectorAll('.lesson');
const sliceGrid = document.getElementById('slice-grid');
const runStepButton = document.getElementById('run-step');
const resetButton = document.getElementById('reset-step');
const stepCaption = document.getElementById('step-caption');

const residualBar = document.getElementById('residual-bar');
const divergenceBar = document.getElementById('divergence-bar');
const residualValue = document.getElementById('residual-value');
const divergenceValue = document.getElementById('divergence-value');
const residualStatus = document.getElementById('residual-status');
const divergenceStatus = document.getElementById('divergence-status');

const sigmaSlider = document.getElementById('sigma-slider');
const tempSlider = document.getElementById('temp-slider');
const alphaSlider = document.getElementById('alpha-slider');
const noiseSlider = document.getElementById('noise-slider');
const modeSelect = document.getElementById('mode-select');

const sigmaOutput = document.getElementById('sigma-output');
const tempOutput = document.getElementById('temp-output');
const alphaOutput = document.getElementById('alpha-output');
const noiseOutput = document.getElementById('noise-output');
const modeOutput = document.getElementById('mode-output');

const shapeOutput = document.getElementById('shape-output');
const speedOutput = document.getElementById('speed-output');
const branchOutput = document.getElementById('branch-output');

const sigmaBoundaryOutput = document.getElementById('sigma-b-output');
const vKinOutput = document.getElementById('vkin-output');
const fillOutput = document.getElementById('fill-output');
const gateOutput = document.getElementById('gate-output');

const cells = [];
const gridSize = 19;
const center = (gridSize - 1) / 2;

const residualPassThreshold = 0.35;
const divergencePassThreshold = 0.14;

const runState = {
  radius: 3.8,
  steps: 0,
};

let animationTimer = null;
let runPhase = 0;
let phaseTick = 0;

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function modeLabel(mode) {
  return mode === 'reflecting' ? 'Reflecting (LK diagnostic divergence)' : 'Fixed-σ Dirichlet';
}

function setStatusChip(el, isPass) {
  el.textContent = isPass ? 'pass' : 'hold';
  el.classList.toggle('status-pass', isPass);
  el.classList.toggle('status-fail', !isPass);
}

function setStatusChipDiagnostic(el) {
  el.textContent = 'diagnostic';
  el.classList.remove('status-pass', 'status-fail');
}

function updateBars(residual, divergence, mode) {
  const residualValueRounded = Number.parseFloat(residual).toFixed(3);
  const divergenceValueRounded = Number.parseFloat(divergence).toFixed(3);

  residualValue.textContent = residualValueRounded;
  divergenceValue.textContent = divergenceValueRounded;

  residualBar.value = clamp(1 - residual, 0, 1);
  divergenceBar.value = clamp(1 - divergence, 0, 1);

  const residualPass = residual <= residualPassThreshold;
  const needsDivergence = mode === 'dirichlet';
  const divergencePass = !needsDivergence || divergence <= divergencePassThreshold;

  setStatusChip(residualStatus, residualPass);

  if (needsDivergence) {
    setStatusChip(divergenceStatus, divergencePass);
  } else {
    setStatusChipDiagnostic(divergenceStatus);
  }
}

function formatFloat(value, digits = 3) {
  return Number.parseFloat(value).toFixed(digits);
}

function buildGrid() {
  sliceGrid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.x = `${x}`;
      cell.dataset.y = `${y}`;
      sliceGrid.appendChild(cell);
      cells.push(cell);
    }
  }
}

function estimateStep() {
  const sigmaInfinity = Number(sigmaSlider.value);
  const temperature = Number(tempSlider.value);
  const noise = Number(noiseSlider.value);
  const alphaHKValue = Number(alphaSlider.value) / 100;
  const mode = modeSelect.value;

  sigmaOutput.textContent = formatFloat(sigmaInfinity, 3);
  tempOutput.textContent = `${temperature}`;
  alphaOutput.textContent = `${Math.round(alphaHKValue * 100)}%`;
  noiseOutput.textContent = `${noise}`;
  modeOutput.textContent = modeLabel(mode);

  const sigmaBoundary = clamp(
    (sigmaInfinity + 0.001) * (0.72 + 0.28 * alphaHKValue) * (1 + 0.007 * (temperature + 20)),
    -0.25,
    0.45,
  );

  const vKin = clamp(0.82 + 0.048 * (temperature + 20) + 0.06 * alphaHKValue, 0.5, 2);
  const hkFlux = Math.max(0, sigmaBoundary) * alphaHKValue * vKin;
  const fillStep = clamp(0.18 + hkFlux * 0.12, 0.02, 0.36);

  const residual = clamp(
    0.55 / (1 + 45 * Math.max(0.001, sigmaInfinity)) + 0.028 * noise + Math.max(0, -temperature - 12) / 260,
    0.02,
    1,
  );
  const divergence = clamp(
    0.29 / (1 + 70 * Math.max(0.001, sigmaInfinity)) + 0.018 * noise + Math.max(0, -temperature - 18) / 220,
    0.015,
    1,
  );

  const residualPass = residual <= residualPassThreshold;
  const needsDivergence = mode === 'dirichlet';
  const divergencePass = !needsDivergence || divergence <= divergencePassThreshold;
  const canGrow = residualPass && divergencePass;

  let shapeTendency = 'compact plate tendency';
  if (sigmaBoundary > 0.06 && temperature > -8) {
    shapeTendency = 'strong branching plate tendency';
  } else if (temperature <= -14 && sigmaInfinity >= 0.04) {
    shapeTendency = 'column-like tendency';
  } else if (sigmaInfinity <= 0.015 && sigmaBoundary <= 0.01) {
    shapeTendency = 'near-flat growth or stalled interface motion';
  }

  let branchTendency = 'low-to-moderate branches';
  if (noise >= 3 && canGrow) {
    branchTendency = 'noisy asymmetry with extra side branches';
  } else if (sigmaInfinity > 0.08 && temperature > -10) {
    branchTendency = 'dense side branching';
  } else if (temperature <= -15) {
    branchTendency = 'side branches weaken as facets orient';
  }

  const growthSpeed = clamp(
    0.45 + 1.5 * hkFlux + 0.08 * alphaHKValue + 0.1 * Math.max(0, 1 - sigmaInfinity * 20),
    0.2,
    3,
  );

  return {
    sigmaInfinity,
    temperature,
    noise,
    alphaHKValue,
    sigmaBoundary,
    vKin,
    hkFlux,
    fillStep,
    residual,
    divergence,
    canGrow,
    shapeTendency,
    branchTendency,
    growthSpeed,
    mode,
    needsDivergence,
    residualPass,
    divergencePass,
  };
}

function drawSlice(radius, pulse = 0, isGrowthFrame = false) {
  const timerPhase = performance.now() / 180;
  const innerRadius = Math.max(0.9, radius - 0.28);
  const growthMargin = 0.6 + 0.25 * pulse;

  for (const cell of cells) {
    const x = Number(cell.dataset.x);
    const y = Number(cell.dataset.y);
    const distance = Math.hypot(x - center, y - center);
    const jitter = 0.13 * Math.sin(distance * 2.4 + timerPhase) * (1 + pulse);
    const boundaryOuter = radius + growthMargin + jitter;

    cell.classList.remove('ice', 'boundary', 'new');

    if (distance <= innerRadius) {
      cell.classList.add('ice');
      continue;
    }

    if (distance > innerRadius && distance <= boundaryOuter) {
      cell.classList.add('boundary');
      if (isGrowthFrame && distance < radius + 0.25) {
        cell.classList.add('new');
      }
    }
  }
}

function renderPredictions() {
  const state = estimateStep();

  shapeOutput.textContent = state.shapeTendency;
  speedOutput.textContent = `${formatFloat(state.growthSpeed, 2)} / 3.00`;
  branchOutput.textContent = state.branchTendency;

  sigmaBoundaryOutput.textContent = formatFloat(state.sigmaBoundary, 3);
  vKinOutput.textContent = formatFloat(state.vKin, 3);
  fillOutput.textContent = formatFloat(state.fillStep, 3);

  gateOutput.textContent = state.canGrow
    ? 'Growth allowed this step'
    : 'Growth paused: quality checks still fail';

  updateBars(state.residual, state.divergence, state.mode);
  return state;
}

function easeInOut(value) {
  return value * value * (3 - 2 * value);
}

function setCaption(text) {
  stepCaption.textContent = text;
}

function runOneGrowthStep() {
  if (animationTimer !== null) {
    return;
  }

  const state = estimateStep();
  const startRadius = runState.radius;
  const maxRadius = gridSize / 2 - 0.7;
  const targetRadius = clamp(startRadius + state.fillStep, 1.5, maxRadius);

  runPhase = 0;
  phaseTick = 0;
  runStepButton.disabled = true;
  resetButton.disabled = true;

  setCaption('Phase A: computing vapor balance (5 quick relax sweeps)...');
  drawSlice(startRadius, 0.1, false);
  updateBars(1, 1, state.mode);

  animationTimer = window.setInterval(() => {
    if (runPhase === 0) {
      const ratio = Math.min(1, (phaseTick + 1) / 5);
      const residual = 1 - ratio * (1 - state.residual);
      const divergence = 1 - ratio * (1 - state.divergence);
      const growth = easeInOut(ratio) * 0.5;

      drawSlice(startRadius + growth, 0.18 * ratio, false);
      updateBars(residual, divergence, state.mode);
      setCaption(`Phase A: relaxation sweep ${Math.min(5, phaseTick + 1)} of 5`);

      phaseTick += 1;
      if (phaseTick > 5) {
        runPhase = 1;
        phaseTick = 0;
      }
      return;
    }

    if (runPhase === 1) {
      updateBars(state.residual, state.divergence, state.mode);
      if (state.canGrow) {
        runPhase = 2;
        setCaption(`Phase B: checks passed. Moving to surface growth (${modeLabel(state.mode)}).`);
      } else {
        runPhase = 4;
        setCaption('Phase B failed. No growth saved. Improve residual quality first.');
      }
      return;
    }

    if (runPhase === 2) {
      const ratio = Math.min(1, phaseTick / 7);
      const eased = easeInOut(ratio);
      const radius = startRadius + (targetRadius - startRadius) * eased;
      drawSlice(radius, 0.6, true);
      setCaption(`Phase C: boundary kinetics adds ice (${Math.round(eased * 100)}%)`);
      phaseTick += 1;
      if (ratio >= 1) {
        runPhase = 3;
      }
      return;
    }

    if (runPhase === 3) {
      runState.radius = targetRadius;
      runState.steps += 1;
      drawSlice(runState.radius, 0.2, false);
      updateBars(state.residual, state.divergence, state.mode);
      setCaption(`Phase D complete: step ${runState.steps} saved to checkpoint chain.`);
      renderPredictions();

      clearInterval(animationTimer);
      animationTimer = null;
      runStepButton.disabled = false;
      resetButton.disabled = false;
      return;
    }

    if (runPhase === 4) {
      drawSlice(startRadius, 0.15, false);
      updateBars(state.residual, state.divergence, state.mode);
      clearInterval(animationTimer);
      animationTimer = null;
      runStepButton.disabled = false;
      resetButton.disabled = false;
      return;
    }
  }, 380);
}

function resetSlice() {
  if (animationTimer !== null) {
    clearInterval(animationTimer);
    animationTimer = null;
  }

  runState.radius = 3.8;
  runState.steps = 0;
  drawSlice(runState.radius, 0, false);
  setCaption('Set controls, then run one cycle.');
  runStepButton.disabled = false;
  resetButton.disabled = false;
  renderPredictions();
}

function wireReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      }
    },
    {
      threshold: 0.2,
    },
  );

  lessonCards.forEach((lessonCard) => observer.observe(lessonCard));
}

runStepButton.addEventListener('click', runOneGrowthStep);
resetButton.addEventListener('click', resetSlice);

sigmaSlider.addEventListener('input', renderPredictions);
tempSlider.addEventListener('input', renderPredictions);
alphaSlider.addEventListener('input', renderPredictions);
noiseSlider.addEventListener('input', renderPredictions);
modeSelect.addEventListener('input', renderPredictions);

buildGrid();
wireReveal();
resetSlice();
