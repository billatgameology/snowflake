(function () {
  "use strict";

  var root = document.getElementById("anim-timeline-events");
  if (!root || !window.Viz) return;

  var body = root.querySelector(".anim__body");
  var controls = root.querySelector(".anim__controls");

  /*
   * Exact constants and closed forms used by core/src/libbrecht.ts. This teaching
   * fixture exercises decision 0011's event arithmetic; it does not run diffusion
   * or grow a crystal.
   */
  var K_BOLTZMANN = 1.380649e-23;
  var M_MOL = 3.0e-26;
  var C_ICE = 3.1e28;
  var D_AIR_1ATM = 2.0e-5;
  var P_ATM = 101325;

  function pSatIce(tempC) {
    var tempK = tempC + 273.15;
    return 3.7e10 * Math.exp(-6150 / tempK) * 100;
  }

  function cSat(tempC) {
    return pSatIce(tempC) / (K_BOLTZMANN * (tempC + 273.15));
  }

  function vKin(tempC) {
    var tempK = tempC + 273.15;
    return (cSat(tempC) / C_ICE) *
      Math.sqrt((K_BOLTZMANN * tempK) / (2 * Math.PI * M_MOL));
  }

  function diffusivity(pressurePa) {
    return D_AIR_1ATM * P_ATM / pressurePa;
  }

  function kineticLength(tempC, pressurePa) {
    return (cSat(tempC) / C_ICE) * diffusivity(pressurePa) / vKin(tempC);
  }

  function mIce(tempC) {
    return C_ICE / cSat(tempC);
  }

  function transformSigma(sigmaOld, oldTempC, newTempC) {
    return (1 + sigmaOld) * cSat(oldTempC) / cSat(newTempC) - 1;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  var GG_FIXTURE = {
    trigger: { kind: "zExtent", value: 25 },
    beforeEnvironment: {
      rho: 0.1,
      phi: 0,
      kappa: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      mu: [0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01],
      ggThreshBeta: [1, 2, 0.5, 2, 0.5, 0.5, 1],
    },
    afterEnvironment: {
      rho: 0.1,
      phi: 0,
      kappa: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      mu: [0.001, 0.001, 0.001, 0.001, 0.001, 0.001, 0.001],
      ggThreshBeta: [5, 2.4, 2.4, 2.4, 1, 1, 1],
    },
    state: {
      tick: 42,
      a: [1, 0, 0, 1, 0, 0],
      b: [1, 0.25, 0.5, 1, 0.125, 0.375],
      d: [0, 0.75, 0.5, 0, 0.875, 0.625],
    },
  };

  var LK_FIXTURE = {
    trigger: { kind: "tick", value: 42 },
    beforeEnvironment: { tempC: -15, sigmaInfinity: 0.002 },
    afterEnvironment: { tempC: -5, sigmaInfinity: 0.003 },
    paramSet: "CAK",
    facetParametersByTempC: [
      {
        tempC: -15,
        basal: { sigma0: 0.024, prefactor: 1 },
        prism: { sigma0: 0.032, prefactor: 1 },
      },
      {
        tempC: -5,
        basal: { sigma0: 0.007, prefactor: 1 },
        prism: { sigma0: 0.0027, prefactor: 0.18 },
      },
    ],
    pressurePa: P_ATM,
    dxM: 0.35e-6,
    state: {
      tick: 42,
      simTimeSeconds: 6.25,
      a: [0, 0, 0, 1, 0],
      f: [0.125, 0.25, 0.5, 1, 0],
    },
    exampleInterfaceStep: {
      deltaTimeSeconds: 0.2,
    },
    cells: [
      {
        id: "interior-low",
        kind: "active interior",
        active: true,
        attached: false,
        wall: false,
        shell: false,
        sigmaOld: 0.002,
      },
      {
        id: "interior-high",
        kind: "active interior",
        active: true,
        attached: false,
        wall: false,
        shell: false,
        sigmaOld: 0.25,
      },
      {
        id: "dirichlet-shell",
        kind: "active Dirichlet shell",
        active: true,
        attached: false,
        wall: false,
        shell: true,
        sigmaOld: 0.002,
      },
      {
        id: "attached-ice",
        kind: "attached ice",
        active: false,
        attached: true,
        wall: false,
        shell: false,
        sigmaOld: 0,
      },
      {
        id: "inactive-wall",
        kind: "inactive wall",
        active: false,
        attached: false,
        wall: true,
        shell: false,
        sigmaOld: 0.4,
      },
    ],
    fillSegments: [
      { label: "interface step before event", tempC: -15, placedFillIceCells: 0.18 },
      { label: "interface step after event", tempC: -5, placedFillIceCells: 0.07 },
    ],
  };

  function facetParameters(tempC, paramSet) {
    if (paramSet !== "CAK") {
      throw new Error("timeline teaching fixture only registers the CAK parameter set");
    }
    var match = LK_FIXTURE.facetParametersByTempC.filter(function (entry) {
      return entry.tempC === tempC;
    })[0];
    if (!match) {
      throw new Error("timeline teaching fixture has no CAK anchor at " + tempC + " C");
    }
    return {
      paramSet: paramSet,
      basal: clone(match.basal),
      prism: clone(match.prism),
    };
  }

  function derivedScales(tempC, pressurePa) {
    return {
      tempC: tempC,
      cSatPerCubicMeter: cSat(tempC),
      vKinMS: vKin(tempC),
      x0M: kineticLength(tempC, pressurePa),
      mIceLedger: mIce(tempC),
      facetParameters: facetParameters(tempC, LK_FIXTURE.paramSet),
    };
  }

  var operator = "GGThreshold";
  var ggStage;
  var ggEnvironment;
  var ggState;
  var lkStage;
  var lkEnvironment;
  var lkCells;
  var lkState;
  var activeFillSegmentCount;
  var shellClampDelta;

  function resetGG() {
    ggStage = "before";
    ggEnvironment = clone(GG_FIXTURE.beforeEnvironment);
    ggState = clone(GG_FIXTURE.state);
  }

  function resetLK() {
    lkStage = "before";
    lkEnvironment = clone(LK_FIXTURE.beforeEnvironment);
    lkCells = LK_FIXTURE.cells.map(function (cell) {
      var copy = clone(cell);
      copy.sigmaCurrent = cell.sigmaOld;
      return copy;
    });
    lkState = clone(LK_FIXTURE.state);
    activeFillSegmentCount = 1;
    shellClampDelta = null;
  }

  resetGG();
  resetLK();

  function currentStage() {
    return operator === "GGThreshold" ? ggStage : lkStage;
  }

  function applyEvent() {
    if (operator === "GGThreshold") {
      if (ggStage !== "before") return;
      ggEnvironment = clone(GG_FIXTURE.afterEnvironment);
      ggStage = "applied";
    } else {
      if (lkStage !== "before") return;
      var oldTempC = LK_FIXTURE.beforeEnvironment.tempC;
      var newTempC = LK_FIXTURE.afterEnvironment.tempC;
      lkCells.forEach(function (cell) {
        if (cell.active && !cell.attached && !cell.wall) {
          cell.sigmaCurrent = transformSigma(cell.sigmaOld, oldTempC, newTempC);
        }
      });
      lkEnvironment = clone(LK_FIXTURE.afterEnvironment);
      lkStage = "transformed";
    }
    render();
  }

  function applyShellClamp() {
    if (operator !== "LibbrechtKinetics" || lkStage !== "transformed") return;
    shellClampDelta = 0;
    lkCells.forEach(function (cell) {
      if (cell.active && !cell.attached && !cell.wall && cell.shell) {
        shellClampDelta += lkEnvironment.sigmaInfinity - cell.sigmaCurrent;
        cell.sigmaCurrent = lkEnvironment.sigmaInfinity;
      }
    });
    lkStage = "reclamped";
    render();
  }

  function advanceExampleInterfaceStep() {
    if (operator !== "LibbrechtKinetics" || lkStage !== "reclamped") return;
    lkState.f[0] += LK_FIXTURE.fillSegments[1].placedFillIceCells;
    lkState.tick += 1;
    lkState.simTimeSeconds += LK_FIXTURE.exampleInterfaceStep.deltaTimeSeconds;
    activeFillSegmentCount = 2;
    lkStage = "stepped";
    render();
  }

  function resetSelected() {
    if (operator === "GGThreshold") resetGG();
    else resetLK();
    render();
  }

  function snapshot() {
    var activeSegments = LK_FIXTURE.fillSegments
      .slice(0, activeFillSegmentCount)
      .map(function (segment) { return clone(segment); });
    return {
      operator: operator,
      stage: currentStage(),
      gg: {
        stage: ggStage,
        environment: clone(ggEnvironment),
        tick: ggState.tick,
        a: ggState.a.slice(),
        b: ggState.b.slice(),
        d: ggState.d.slice(),
      },
      lk: {
        stage: lkStage,
        environment: clone(lkEnvironment),
        cells: lkCells.map(function (cell) { return clone(cell); }),
        state: clone(lkState),
        derived: derivedScales(lkEnvironment.tempC, LK_FIXTURE.pressurePa),
        fillSegments: activeSegments,
        shellClampDelta: shellClampDelta,
      },
    };
  }

  function fixtures() {
    return {
      constants: {
        kBoltzmann: K_BOLTZMANN,
        waterMoleculeMassKg: M_MOL,
        iceNumberDensityPerCubicMeter: C_ICE,
        airDiffusivityAtOneAtmosphereM2PerS: D_AIR_1ATM,
        referencePressurePa: P_ATM,
      },
      gg: clone(GG_FIXTURE),
      lk: clone(LK_FIXTURE),
    };
  }

  function node(tag, text, css) {
    var element = document.createElement(tag);
    if (text !== undefined && text !== null) element.textContent = text;
    if (css) element.setAttribute("style", css);
    return element;
  }

  function valueText(value) {
    if (typeof value !== "number") return String(value);
    if (value === 0) return "0";
    if (Math.abs(value) >= 0.001 && Math.abs(value) < 1000) {
      return value.toPrecision(8).replace(/0+$/, "").replace(/\.$/, "");
    }
    return value.toExponential(6);
  }

  function vectorText(values) {
    return "[" + values.map(function (value) { return valueText(value); }).join(", ") + "]";
  }

  function card(title) {
    var element = node("section");
    element.className = "c21-card";
    element.appendChild(node("h3", title));
    return element;
  }

  function rows(items) {
    var container = node("div");
    container.className = "c21-rows";
    items.forEach(function (item) {
      container.appendChild(node("span", item[0]));
      container.appendChild(node("span", item[1]));
    });
    return container;
  }

  function statusBox(text, tone) {
    var element = node("p", text,
      "margin:0.8rem 0 0;padding:0.7rem 0.85rem;border-radius:8px;" +
      "background:var(--surface-sunken);border-left:4px solid " + tone + ";" +
      "font-size:var(--step--1);color:var(--ink-primary);");
    element.setAttribute("role", "status");
    element.setAttribute("aria-live", "polite");
    return element;
  }

  function renderGG() {
    var colors = Viz.colors();
    var grid = node("div");
    grid.className = "c21-cards";

    var environmentCard = card(ggStage === "before"
      ? "Before event — hollow-column controls"
      : "After event — simple-cap controls");
    environmentCard.appendChild(rows([
      ["event boundary", "z extent = " + GG_FIXTURE.trigger.value],
      ["completed tick", String(ggState.tick)],
      ["rho / phi", valueText(ggEnvironment.rho) + " / " + valueText(ggEnvironment.phi)],
      ["kappa, 7 slots", vectorText(ggEnvironment.kappa)],
      ["mu, 7 slots", vectorText(ggEnvironment.mu)],
      ["ggThreshBeta, 7 slots", vectorText(ggEnvironment.ggThreshBeta)],
    ]));

    var stateCard = card("State bytes around the event");
    stateCard.appendChild(rows([
      ["a", vectorText(ggState.a)],
      ["b", vectorText(ggState.b)],
      ["d", vectorText(ggState.d)],
      ["tick", String(ggState.tick)],
    ]));

    grid.appendChild(environmentCard);
    grid.appendChild(stateCard);
    body.appendChild(grid);
    body.appendChild(statusBox(
      ggStage === "before"
        ? "The event is waiting at a completed-cycle boundary. Its controls are G–G parameters, not temperature or physical humidity."
        : "Only the complete parameter bundle changed. The event performed no relaxation, surface update, field reconstruction, or tick advance; compare a, b and d with the raw fixture.",
      ggStage === "before" ? colors.inkSecondary : colors.good
    ));
  }

  function makeCellTable() {
    var colors = Viz.colors();
    var wrap = node("div", null, "overflow-x:auto;");
    wrap.className = "table-wrap";
    var table = node("table");
    table.setAttribute("style",
      "width:100%;border-collapse:collapse;min-width:38rem;font-size:0.8rem;");
    var caption = node("caption",
      "Cellwise density transform. Attached and inactive wall rows are excluded.",
      "text-align:left;margin-bottom:0.45rem;color:var(--ink-secondary);");
    table.appendChild(caption);
    var thead = node("thead");
    var header = node("tr");
    ["cell", "role", "sigma before", "sigma now", "absolute density now"].forEach(function (label) {
      var th = node("th", label,
        "text-align:left;padding:0.35rem 0.5rem;border-bottom:1px solid " +
        colors.ruleStrong + ";white-space:nowrap;");
      header.appendChild(th);
    });
    thead.appendChild(header);
    table.appendChild(thead);
    var tbody = node("tbody");
    lkCells.forEach(function (cell) {
      var tr = node("tr");
      var density = cell.active && !cell.attached && !cell.wall
        ? (1 + cell.sigmaCurrent) * cSat(lkEnvironment.tempC)
        : null;
      [
        cell.id,
        cell.kind,
        valueText(cell.sigmaOld),
        valueText(cell.sigmaCurrent),
        density === null ? "excluded" : valueText(density),
      ].forEach(function (value, index) {
        var td = node("td", value,
          "padding:0.38rem 0.5rem;border-bottom:1px solid " + colors.rule + ";" +
          (index >= 2 ? "font-family:var(--font-mono);white-space:nowrap;" : ""));
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  function renderLK() {
    var colors = Viz.colors();
    var scales = derivedScales(lkEnvironment.tempC, LK_FIXTURE.pressurePa);
    var grid = node("div");
    grid.className = "c21-cards";

    var environmentCard = card("Environment and atomic derived bundle");
    environmentCard.appendChild(rows([
      ["stage", lkStage],
      ["temperature", valueText(lkEnvironment.tempC) + " °C"],
      ["explicit sigmaInfinity", valueText(lkEnvironment.sigmaInfinity)],
      ["cSat", valueText(scales.cSatPerCubicMeter) + " m⁻³"],
      ["vKin", valueText(scales.vKinMS) + " m/s"],
      ["X0", valueText(scales.x0M) + " m"],
      ["M_ice", valueText(scales.mIceLedger) + " vapor units/ice cell"],
      ["facet parameter set", scales.facetParameters.paramSet],
      ["basal (sigma0, A)", "(" +
        valueText(scales.facetParameters.basal.sigma0) + ", " +
        valueText(scales.facetParameters.basal.prefactor) + ")"],
      ["prism (sigma0, A)", "(" +
        valueText(scales.facetParameters.prism.sigma0) + ", " +
        valueText(scales.facetParameters.prism.prefactor) + ")"],
    ]));

    var shellCard = card("Dirichlet shell");
    var shell = lkCells.filter(function (cell) { return cell.shell; })[0];
    shellCard.appendChild(rows([
      ["sigma before event", valueText(shell.sigmaOld)],
      ["sigma now", valueText(shell.sigmaCurrent)],
      ["new clamp target", valueText(LK_FIXTURE.afterEnvironment.sigmaInfinity)],
      ["clamp diagnostic delta", shellClampDelta === null ? "not applied" : valueText(shellClampDelta)],
    ]));
    shellCard.appendChild(node("p",
      lkStage === "before"
        ? "The shell is still at the old environment."
        : lkStage === "transformed"
          ? "The shell has undergone the same density transform as the interior. The new reservoir target has not been applied yet."
          : "The shell is at the explicit new target. Its signed change is a numerical reservoir diagnostic, not kinetic uptake.",
      "margin:0.65rem 0 0;font-size:0.78rem;color:var(--ink-secondary);"));

    var stateCard = card("Topology, fill, time and completed ledgers");
    stateCard.appendChild(rows([
      ["a occupancy bytes", vectorText(lkState.a)],
      ["f fill values", vectorText(lkState.f)],
      ["completed tick", String(lkState.tick)],
      ["physical time", valueText(lkState.simTimeSeconds) + " s"],
      ["completed ledger segments", String(activeFillSegmentCount)],
    ]));
    stateCard.appendChild(node("p",
      lkStage === "stepped"
        ? "The example interface step deposited its 0.07-cell increment into f[0], advanced tick and physical time, and appended the matching ledger segment. No cell saturated, so a stayed unchanged."
        : "The event and shell clamp leave these values byte-for-byte unchanged. Only an interface step may advance physical time or add a completed ledger segment.",
      "margin:0.65rem 0 0;font-size:0.78rem;color:var(--ink-secondary);"));

    grid.appendChild(environmentCard);
    grid.appendChild(shellCard);
    grid.appendChild(stateCard);
    body.appendChild(grid);
    body.appendChild(makeCellTable());

    var ledgerCard = card("Step-local vapor-equivalent fill bookkeeping");
    var activeSegments = LK_FIXTURE.fillSegments.slice(0, activeFillSegmentCount);
    var ledgerRows = activeSegments.map(function (segment) {
      return [
        segment.label + " (" + valueText(segment.tempC) + " °C)",
        valueText(segment.placedFillIceCells) + " × M_ice(" +
          valueText(segment.tempC) + " °C)",
      ];
    });
    if (activeFillSegmentCount < LK_FIXTURE.fillSegments.length) {
      ledgerRows.push(["post-event interface step", "not advanced in this state"]);
    }
    ledgerCard.appendChild(rows(ledgerRows));
    if (activeFillSegmentCount === LK_FIXTURE.fillSegments.length) {
      var weighted = activeSegments.reduce(function (sum, segment) {
        return sum + segment.placedFillIceCells * mIce(segment.tempC);
      }, 0);
      var totalFill = activeSegments.reduce(function (sum, segment) {
        return sum + segment.placedFillIceCells;
      }, 0);
      var wrong = totalFill * mIce(lkEnvironment.tempC);
      ledgerCard.appendChild(rows([
        ["step-local weighted total", valueText(weighted)],
        ["counterfactual: all fill × final M_ice", valueText(wrong)],
      ]));
    }
    body.appendChild(ledgerCard);

    var status;
    if (lkStage === "before") {
      status = "Apply the event. Active vapour cells, including the shell, will conserve (1 + sigma) × cSat(T); attached and wall cells will not be touched.";
    } else if (lkStage === "transformed") {
      status = "The active-cell transform is complete. Its negative sigma values remain visible; a, f, completed tick, physical time and prior ledger segments did not jump. The shell still awaits the next solve's explicit clamp.";
    } else if (lkStage === "reclamped") {
      status = "The guaranteed shell clamp from the next solve is now isolated. Advance the example interface step to deposit its fill, add a new-temperature ledger segment, and advance its clock.";
    } else {
      status = "The interface example advanced tick and physical time, deposited 0.07 into f[0], and added a matching temperature-tagged ledger segment; a stayed fixed because no cell saturated. Recompute the weighted total from the raw segments; multiplying both by the final M_ice gives a different number.";
    }
    body.appendChild(statusBox(status, lkStage === "before" ? colors.inkSecondary : colors.good));
  }

  var operatorButtons = [];
  var applyButton;
  var clampButton;
  var stepButton;

  function updateControls() {
    operatorButtons.forEach(function (button) {
      button.setAttribute("aria-pressed",
        String(button.dataset.operator === operator));
    });
    applyButton.disabled = currentStage() !== "before";
    clampButton.disabled =
      operator !== "LibbrechtKinetics" || lkStage !== "transformed";
    stepButton.disabled =
      operator !== "LibbrechtKinetics" || lkStage !== "reclamped";
  }

  function render() {
    body.textContent = "";
    root.dataset.timelineOperator = operator;
    root.dataset.timelineStage = currentStage();
    root.dataset.eventMode = "abrupt";
    if (operator === "GGThreshold") renderGG();
    else renderLK();
    updateControls();
  }

  [
    ["G–G event", "GGThreshold"],
    ["LK temperature event", "LibbrechtKinetics"],
  ].forEach(function (entry) {
    var button = Viz.button(controls, entry[0], function () {
      operator = entry[1];
      if (operator === "GGThreshold") resetGG();
      else resetLK();
      render();
    }, { pressed: operator === entry[1] });
    button.dataset.control = "timeline-operator";
    button.dataset.operator = entry[1];
    operatorButtons.push(button);
  });

  applyButton = Viz.button(controls, "Apply abrupt event", applyEvent);
  applyButton.dataset.control = "timeline-apply";

  clampButton = Viz.button(controls, "Apply next solve’s shell clamp", applyShellClamp);
  clampButton.dataset.control = "timeline-solve";

  stepButton = Viz.button(controls, "Advance example interface step", advanceExampleInterfaceStep);
  stepButton.dataset.control = "timeline-step";

  var resetButton = Viz.button(controls, "Reset selected event", resetSelected);
  resetButton.dataset.control = "timeline-reset";

  window.__educationTimelineEvents = Object.freeze({
    version: 1,
    fixtures: fixtures,
    cSat: cSat,
    vKin: vKin,
    kineticLength: kineticLength,
    mIce: mIce,
    transformSigma: transformSigma,
    snapshot: snapshot,
  });

  render();
  Viz.onThemeChange(render);
})();
