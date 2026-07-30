/* ============================================================================
   FACET versus CM7: two mathematical uses of two prism-growth processes.

   FACET (Libbrecht & Walkling, arXiv:2306.04042v1, pp. 8-9) adds two
   terrace-nucleation terms. Table 1 supplies the six parameter rows below.
   For a flat facet, the Gibbs-Thomson curvature term in the printed equation
   is zero, leaving the two exponent denominators equal to sigmaSurf.

   CM7 (Libbrecht, arXiv:2004.06212v1, pp. 3-4) uses the same two barrier
   values at -2 C, 0.03% and 0.15%, differently: a large-prism branch and a
   kinetic-roughening branch are alternatives. The paper says their transition
   may be smooth or abrupt and is not constrained by theory or experiment.
   ========================================================================== */

(function () {
  "use strict";

  const root = document.getElementById("anim-facet-processes");
  if (!root || !window.Viz) return;

  const body = root.querySelector(".anim__body");
  const controls = root.querySelector(".anim__controls");
  const head = root.querySelector(".anim__head");

  /* sigmaZero values are fractions in the source table, not percentages. */
  const FACET_TABLE = Object.freeze([
    Object.freeze({ tempC: -1,  vKin: 690, A1: 0.30, sigmaZero1: 3e-5, A2: 0.70, sigmaZero2: 1e-3 }),
    Object.freeze({ tempC: -2,  vKin: 635, A1: 0.25, sigmaZero1: 3e-4, A2: 0.75, sigmaZero2: 1.5e-3 }),
    Object.freeze({ tempC: -3,  vKin: 585, A1: 0.20, sigmaZero1: 1e-3, A2: 0.80, sigmaZero2: 3e-3 }),
    Object.freeze({ tempC: -5,  vKin: 496, A1: 0.20, sigmaZero1: 2e-3, A2: 0.80, sigmaZero2: 5.5e-3 }),
    Object.freeze({ tempC: -7,  vKin: 419, A1: 0.50, sigmaZero1: 8e-3, A2: 0.50, sigmaZero2: 1e-2 }),
    Object.freeze({ tempC: -15, vKin: 208, A1: 1.00, sigmaZero1: 3e-2, A2: 0.00, sigmaZero2: null }),
  ]);

  const CM7 = Object.freeze({
    large: Object.freeze({ A: 0.25, sigmaZeroPercent: 0.03 }),
    rough: Object.freeze({ A: 1.00, sigmaZeroPercent: 0.15 }),
  });

  let mode = "facet-additive";
  let tempC = -2;
  let sigmaSurfPercent = 0.20;
  let svg = null;

  const status = document.createElement("p");
  status.className = "anim__sub";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.style.fontWeight = "600";
  head.appendChild(status);

  const stage = document.createElement("div");
  const legendBox = document.createElement("div");
  body.appendChild(stage);
  body.appendChild(legendBox);

  function rowFor(t) {
    return FACET_TABLE.find(function (row) { return row.tempC === t; });
  }

  function term(A, sigmaZeroPercent, sigmaPercent) {
    if (!A || sigmaZeroPercent == null || sigmaPercent <= 0) return 0;
    return A * Math.exp(-sigmaZeroPercent / sigmaPercent);
  }

  function evaluate(nextMode, nextTempC, nextSigmaPercent) {
    const sigmaPercent = Math.max(1e-9, Number(nextSigmaPercent));
    if (nextMode === "cm7-large") {
      const value = term(CM7.large.A, CM7.large.sigmaZeroPercent, sigmaPercent);
      return {
        mode: nextMode, tempC: -2, sigmaSurfPercent: sigmaPercent,
        component1: value, component2: 0, alphaHK: value,
      };
    }
    if (nextMode === "cm7-rough") {
      const value = term(CM7.rough.A, CM7.rough.sigmaZeroPercent, sigmaPercent);
      return {
        mode: nextMode, tempC: -2, sigmaSurfPercent: sigmaPercent,
        component1: 0, component2: value, alphaHK: value,
      };
    }

    const row = rowFor(Number(nextTempC)) || rowFor(-2);
    const one = term(row.A1, row.sigmaZero1 * 100, sigmaPercent);
    const two = term(row.A2, row.sigmaZero2 == null ? null : row.sigmaZero2 * 100, sigmaPercent);
    return {
      mode: "facet-additive", tempC: row.tempC, sigmaSurfPercent: sigmaPercent,
      component1: one, component2: two, alphaHK: one + two,
    };
  }

  function curveFor(which, row) {
    const points = [];
    const lo = Math.log10(0.005);
    const hi = Math.log10(5);
    for (let i = 0; i <= 180; i++) {
      const sigma = Math.pow(10, lo + (hi - lo) * i / 180);
      let value;
      if (which === "facet-sum") {
        value =
          term(row.A1, row.sigmaZero1 * 100, sigma) +
          term(row.A2, row.sigmaZero2 == null ? null : row.sigmaZero2 * 100, sigma);
      } else if (which === "facet-one") {
        value = term(row.A1, row.sigmaZero1 * 100, sigma);
      } else if (which === "facet-two") {
        value = term(row.A2, row.sigmaZero2 == null ? null : row.sigmaZero2 * 100, sigma);
      } else if (which === "cm7-large") {
        value = term(CM7.large.A, CM7.large.sigmaZeroPercent, sigma);
      } else {
        value = term(CM7.rough.A, CM7.rough.sigmaZeroPercent, sigma);
      }
      points.push([sigma, value]);
    }
    return points;
  }

  function syncModeButtons() {
    [buttonFacet, buttonLarge, buttonRough].forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
    });
    const cm7Mode = mode !== "facet-additive";
    tempSelect.disabled = cm7Mode;
    if (cm7Mode) {
      tempC = -2;
      tempSelect.value = "-2";
    }
  }

  function buildLegend() {
    const c = Viz.colors();
    legendBox.textContent = "";
    if (mode === "facet-additive") {
      Viz.legend(legendBox, [
        { color: c.series[0], label: "FACET: sum of both processes" },
        { color: c.series[2], label: "process 1 contribution" },
        { color: c.series[1], label: "process 2 contribution" },
      ]);
    } else {
      Viz.legend(legendBox, [
        { color: c.series[0], label: "CM7 branch selected for this display" },
        { color: c.muted, label: "the alternative branch, not added" },
      ]);
    }
  }

  function render() {
    const c = Viz.colors();
    const row = rowFor(tempC);
    const result = evaluate(mode, tempC, sigmaSurfPercent);
    const W = 720;
    const H = 370;
    const plot = { x0: 72, x1: W - 28, y0: H - 58, y1: 28 };
    const xs = Viz.scaleLog([0.005, 5], [plot.x0, plot.x1]);
    const ys = Viz.scaleLinear([0, 1.05], [plot.y0, plot.y1]);

    if (svg) svg.remove();
    svg = Viz.createSvg(stage, W, H, {
      label:
        "Prism attachment response against surface supersaturation, comparing the additive " +
        "FACET parameterization with CM7's mutually exclusive branches.",
      desc:
        "The FACET view adds two nucleation terms. At minus two Celsius, CM7 instead selects " +
        "either a large-prism branch or a kinetic-roughening branch; its selection law is unknown.",
    });

    Viz.axisLeft(svg, ys, {
      x: plot.x0,
      values: [0, 0.25, 0.5, 0.75, 1],
      grid: true,
      gridTo: plot.x1,
      title: "Attachment coefficient alphaHK",
      titleOffset: 52,
      format: function (v) { return v.toFixed(2); },
    });
    Viz.axisBottom(svg, xs, {
      y: plot.y0,
      values: [0.005, 0.01, 0.03, 0.1, 0.3, 1, 3],
      title: "Surface supersaturation sigmaSurf (%) — logarithmic",
      titleOffset: 40,
      format: function (v) { return v < 0.1 ? v.toFixed(3) : v.toFixed(1); },
    });

    if (mode === "facet-additive") {
      Viz.series(svg, curveFor("facet-one", row), xs, ys, {
        color: c.series[2], width: 1.6, dashed: true,
      });
      if (row.A2) {
        Viz.series(svg, curveFor("facet-two", row), xs, ys, {
          color: c.series[1], width: 1.6, dashed: true,
        });
      }
      Viz.series(svg, curveFor("facet-sum", row), xs, ys, {
        color: c.series[0], width: 2.8,
      });
    } else {
      const chosen = mode === "cm7-large" ? "cm7-large" : "cm7-rough";
      const other = mode === "cm7-large" ? "cm7-rough" : "cm7-large";
      Viz.series(svg, curveFor(other, rowFor(-2)), xs, ys, {
        color: c.muted, width: 1.7, dashed: true,
      });
      Viz.series(svg, curveFor(chosen, rowFor(-2)), xs, ys, {
        color: c.series[0], width: 2.8,
      });
    }

    const markerX = xs(sigmaSurfPercent);
    const markerY = ys(result.alphaHK);
    svg.appendChild(Viz.svgEl("line", {
      x1: markerX, x2: markerX, y1: plot.y1, y2: plot.y0,
      stroke: c.inkSecondary, "stroke-width": 1, "stroke-dasharray": "3 4",
    }));
    svg.appendChild(Viz.svgEl("circle", {
      cx: markerX, cy: markerY, r: 6,
      fill: c.series[0], stroke: c.surface, "stroke-width": 2,
    }));
    const markerLabel = Viz.svgEl("text", {
      class: "series-label",
      x: Math.min(plot.x1 - 4, markerX + 9),
      y: Math.max(plot.y1 + 14, markerY - 9),
      "text-anchor": markerX > plot.x1 - 110 ? "end" : "start",
      fill: c.series[0],
    });
    markerLabel.textContent = "alphaHK = " + result.alphaHK.toFixed(3);
    svg.appendChild(markerLabel);

    root.dataset.branchMode = mode;
    root.dataset.tempC = String(result.tempC);
    root.dataset.sigmaSurfPercent = result.sigmaSurfPercent.toFixed(4);
    root.dataset.componentOne = result.component1.toFixed(9);
    root.dataset.componentTwo = result.component2.toFixed(9);
    root.dataset.alphaHK = result.alphaHK.toFixed(9);
    root.dataset.branchSelectionLaw = mode === "facet-additive" ? "not-applicable" : "unknown";
    root.dataset.curvatureTerm = "zero-flat-facet";

    if (mode === "facet-additive") {
      status.textContent =
        "FACET at " + result.tempC + " °C and sigmaSurf = " +
        result.sigmaSurfPercent.toFixed(2) + "%: process 1 contributes " +
        result.component1.toFixed(3) + ", process 2 contributes " +
        result.component2.toFixed(3) + ", and the model adds them to alphaHK = " +
        result.alphaHK.toFixed(3) + ".";
    } else {
      const branchName = mode === "cm7-large" ? "large-prism" : "kinetic-roughening";
      status.textContent =
        "CM7 at 2 °C below freezing selects the " + branchName +
        " branch: alphaHK = " + result.alphaHK.toFixed(3) +
        ". The dashed curve is the alternative, not a second contribution. " +
        "The source does not supply the branch-selection law.";
    }
  }

  const modeWrap = document.createElement("div");
  modeWrap.className = "control";
  modeWrap.style.flexWrap = "wrap";
  const modeLabel = document.createElement("span");
  modeLabel.textContent = "Interpretation:";
  modeLabel.style.fontWeight = "600";
  modeWrap.appendChild(modeLabel);
  controls.appendChild(modeWrap);

  const buttonFacet = Viz.button(modeWrap, "FACET: add both", function () {
    mode = "facet-additive";
    syncModeButtons();
    buildLegend();
    render();
  }, { pressed: true });
  buttonFacet.dataset.mode = "facet-additive";

  const buttonLarge = Viz.button(modeWrap, "CM7: large prism", function () {
    mode = "cm7-large";
    syncModeButtons();
    buildLegend();
    render();
  }, { pressed: false });
  buttonLarge.dataset.mode = "cm7-large";

  const buttonRough = Viz.button(modeWrap, "CM7: rough branch", function () {
    mode = "cm7-rough";
    syncModeButtons();
    buildLegend();
    render();
  }, { pressed: false });
  buttonRough.dataset.mode = "cm7-rough";

  const tempWrap = document.createElement("div");
  tempWrap.className = "control";
  const tempLabel = document.createElement("label");
  tempLabel.setAttribute("for", "facet-process-temperature");
  tempLabel.textContent = "Temperature";
  const tempSelect = document.createElement("select");
  tempSelect.id = "facet-process-temperature";
  tempSelect.dataset.control = "temperature-c";
  FACET_TABLE.forEach(function (row) {
    const option = document.createElement("option");
    option.value = String(row.tempC);
    option.textContent = String(row.tempC) + " °C";
    option.selected = row.tempC === tempC;
    tempSelect.appendChild(option);
  });
  tempSelect.addEventListener("change", function () {
    tempC = Number(tempSelect.value);
    render();
  });
  tempWrap.appendChild(tempLabel);
  tempWrap.appendChild(tempSelect);
  controls.appendChild(tempWrap);

  const sigmaControl = Viz.slider(controls, {
    label: "Surface supersaturation sigmaSurf",
    id: "facet-process-sigma",
    min: 0.01,
    max: 3,
    step: 0.01,
    value: sigmaSurfPercent,
    format: function (v) { return v.toFixed(2) + "%"; },
    onInput: function (v) {
      sigmaSurfPercent = v;
      render();
    },
  });
  sigmaControl.input.dataset.control = "sigma-surf-percent";

  window.EducationTestHooks = window.EducationTestHooks || {};
  window.EducationTestHooks.facetProcesses = Object.freeze({
    evaluate: evaluate,
    table: FACET_TABLE,
  });

  syncModeButtons();
  buildLegend();
  render();
  Viz.onThemeChange(function () {
    buildLegend();
    render();
  });
})();
