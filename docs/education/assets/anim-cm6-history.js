/* ==========================================================================
   CM6 history / hysteresis explorer

   This is deliberately a branch-memory and restricted coefficient-order
   schematic, not a morphology solver.
   The two basal curves and their source-printed/model-inferred -5 C parameters are source-backed; the rule
   that maps the two control choices to a persistent branch is an explanatory
   device because CM6 prints no transition law or facet-width threshold.
   ======================================================================= */
(function () {
  "use strict";

  function init() {
    const root = document.getElementById("anim-cm6-history");
    if (!root || root.dataset.cm6Ready === "true") return;

    const body = root.querySelector(".anim__body");
    const controls = root.querySelector(".anim__controls");
    if (!body || !controls || !window.Viz) return;
    root.dataset.cm6Ready = "true";

    const W = 760;
    const H = 390;
    const SIGMA_SURF = 0.2;
    const BASAL = {
      broad: { sigma0: 0.7, label: "broad basal state" },
      narrow: { sigma0: 0.1, label: "narrow basal state" },
    };
    const PRISM = { sigma0: 0.2, A: 0.2 };

    const state = {
      pulse: "gentle",
      surfaceMode: "history",
    };

    const status = document.createElement("p");
    status.className = "anim__sub";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.setAttribute("data-test-hook", "cm6-history-status");
    status.style.margin = "0.65rem 0 0";
    root.querySelector(".anim__head").appendChild(status);

    function alphaHK(sigma0, A, sigmaSurf) {
      return (A == null ? 1 : A) * Math.exp(-sigma0 / sigmaSurf);
    }

    function selectedBasalState(pulse, surfaceMode) {
      if (surfaceMode === "broad" || surfaceMode === "narrow") {
        return surfaceMode;
      }
      return pulse === "fast" ? "narrow" : "broad";
    }

    function restrictedOrder(basalState, sigmaSurf) {
      const basalValue = alphaHK(BASAL[basalState].sigma0, 1, sigmaSurf);
      const prismValue = alphaHK(PRISM.sigma0, PRISM.A, sigmaSurf);
      if (basalValue > prismValue) return "basal-higher";
      if (prismValue > basalValue) return "prism-higher";
      return "tie";
    }

    function evaluate(input) {
      const config = input || {};
      const pulse = config.pulse == null ? "gentle" : config.pulse;
      const surfaceMode = config.surfaceMode == null ? "history" : config.surfaceMode;
      const sigmaSurf = config.sigmaSurfPercent == null ? SIGMA_SURF : Number(config.sigmaSurfPercent);

      if (pulse !== "gentle" && pulse !== "fast") {
        throw new RangeError("CM6 pulse must be gentle or fast");
      }
      if (!["history", "broad", "narrow"].includes(surfaceMode)) {
        throw new RangeError("CM6 surfaceMode must be history, broad, or narrow");
      }
      if (!(sigmaSurf > 0) || !Number.isFinite(sigmaSurf)) {
        throw new RangeError("CM6 surface supersaturation must be a positive finite percentage");
      }

      const basalState = selectedBasalState(pulse, surfaceMode);
      const alphaHKBasal = alphaHK(BASAL[basalState].sigma0, 1, sigmaSurf);
      const alphaHKPrism = alphaHK(PRISM.sigma0, PRISM.A, sigmaSurf);
      return {
        pulse: pulse,
        surfaceMode: surfaceMode,
        sigmaSurfPercent: sigmaSurf,
        basalState: basalState,
        sigma0BasalPercent: BASAL[basalState].sigma0,
        sigma0PrismPercent: PRISM.sigma0,
        prismA: PRISM.A,
        alphaHKBasal: alphaHKBasal,
        alphaHKPrism: alphaHKPrism,
        restrictedOrder: restrictedOrder(basalState, sigmaSurf),
      };
    }

    function roundedRect(svg, x, y, width, height, fill, stroke) {
      svg.appendChild(Viz.svgEl("rect", {
        x: x, y: y, width: width, height: height, rx: 8,
        fill: fill, stroke: stroke, "stroke-width": 1.3,
      }));
    }

    function text(svg, value, x, y, options) {
      const opts = options || {};
      const node = Viz.svgEl("text", {
        x: x,
        y: y,
        fill: opts.fill,
        "font-size": opts.size || 12,
        "font-weight": opts.weight || 500,
        "text-anchor": opts.anchor || "start",
        "font-family": "var(--font-sans)",
      });
      node.textContent = value;
      svg.appendChild(node);
      return node;
    }

    function drawCoefficientOrder(svg, cx, cy, order, basalValue, prismValue, c) {
      const maximum = Math.max(basalValue, prismValue);
      const startX = cx - 92;
      const maxWidth = 184;
      [
        { label: "basal", value: basalValue, color: c.series[0], y: cy - 38 },
        { label: "prism", value: prismValue, color: c.series[1], y: cy + 18 },
      ].forEach(function (entry) {
        text(svg, entry.label, startX, entry.y - 7, {
          fill: c.inkSecondary, size: 11.5, weight: 660,
        });
        svg.appendChild(Viz.svgEl("rect", {
          x: startX,
          y: entry.y,
          width: maxWidth * entry.value / maximum,
          height: 16,
          rx: 4,
          fill: entry.color,
          "fill-opacity": 0.72,
          "data-coefficient-series": entry.label,
        }));
      });
      text(svg, order.replace("-", " ") + " alphaHK", cx, cy + 78, {
        anchor: "middle", fill: c.ink, size: 12.5, weight: 680,
      });
    }

    let svg = null;

    function render() {
      if (svg) svg.remove();
      const c = Viz.colors();
      const result = evaluate({
        pulse: state.pulse,
        surfaceMode: state.surfaceMode,
        sigmaSurfPercent: SIGMA_SURF,
      });
      const basalState = result.basalState;
      const basalValue = result.alphaHKBasal;
      const prismValue = result.alphaHKPrism;
      const order = result.restrictedOrder;

      root.dataset.initialPulse = state.pulse;
      root.dataset.surfaceMode = state.surfaceMode;
      root.dataset.basalState = basalState;
      root.setAttribute("data-attachment-hk-basal", basalValue.toFixed(6));
      root.setAttribute("data-attachment-hk-prism", prismValue.toFixed(6));
      root.dataset.restrictedOrder = order;
      root.dataset.habitProxy = "false";

      svg = Viz.createSvg(body, W, H, {
        label: "A schematic history experiment at minus five degrees Celsius. A gentle or fast " +
          "initial growth period can leave the basal surface on a broad or narrow branch. The " +
          "later environment is identical in both cases, but the retained branch changes the " +
          "local basal-versus-prism attachment-coefficient order at one shared surface field.",
        desc: "The selected initial history is " + state.pulse + ". The selected basal state is " +
          basalState + ", giving restricted order " + order +
          ". Diagnostic only — not a habit boundary or habit classification.",
      });

      const left = { x: 28, y: 30, w: 430, h: 318 };
      const right = { x: 482, y: 30, w: 250, h: 318 };
      roundedRect(svg, left.x, left.y, left.w, left.h, c.sunken, c.rule);
      roundedRect(svg, right.x, right.y, right.w, right.h, c.surface, c.rule);

      text(svg, "1  INITIAL HISTORY", left.x + 20, left.y + 30, {
        fill: c.inkSecondary, size: 11, weight: 720,
      });
      text(svg, state.pulse === "fast" ? "fast-growth pulse" : "gentle start",
        left.x + 20, left.y + 58, {
          fill: state.pulse === "fast" ? c.critical : c.good, size: 18, weight: 720,
        });

      const timelineY = left.y + 104;
      svg.appendChild(Viz.svgEl("line", {
        x1: left.x + 28, x2: left.x + left.w - 28,
        y1: timelineY, y2: timelineY,
        stroke: c.ruleStrong, "stroke-width": 4, "stroke-linecap": "round",
      }));
      svg.appendChild(Viz.svgEl("line", {
        x1: left.x + 28, x2: left.x + 150,
        y1: timelineY, y2: timelineY,
        stroke: state.pulse === "fast" ? c.critical : c.good,
        "stroke-width": state.pulse === "fast" ? 12 : 6,
        "stroke-linecap": "round",
      }));
      text(svg, "start", left.x + 28, timelineY + 24, {
        fill: c.muted, size: 11, anchor: "middle",
      });
      text(svg, "history set here", left.x + 150, timelineY + 24, {
        fill: c.muted, size: 11, anchor: "middle",
      });
      text(svg, "same later environment", left.x + 300, timelineY + 24, {
        fill: c.muted, size: 11, anchor: "middle",
      });

      svg.appendChild(Viz.svgEl("path", {
        d: "M " + (left.x + 150) + " " + (timelineY + 48) +
          " C " + (left.x + 190) + " " + (timelineY + 76) + ", " +
          (left.x + 210) + " " + (timelineY + 76) + ", " +
          (left.x + 250) + " " + (timelineY + 48),
        fill: "none",
        stroke: c.inkSecondary,
        "stroke-width": 1.5,
        "stroke-dasharray": "4 4",
      }));
      text(svg, "branch retained in this schematic", left.x + 200, timelineY + 94, {
        fill: c.inkSecondary, size: 11.5, anchor: "middle", weight: 620,
      });

      text(svg, "2  BASAL SURFACE STATE", left.x + 20, left.y + 238, {
        fill: c.inkSecondary, size: 11, weight: 720,
      });
      text(svg, BASAL[basalState].label, left.x + 20, left.y + 268, {
        fill: c.series[0], size: 18, weight: 720,
      });
      text(svg,
        "σ₀,basal = " + BASAL[basalState].sigma0.toFixed(1) +
          "%  →  alphaHK,basal = " + basalValue.toFixed(3),
        left.x + 20, left.y + 294, {
          fill: c.ink, size: 12.5, weight: 620,
        });

      text(svg, "3  RESTRICTED LOCAL ORDER", right.x + 20, right.y + 30, {
        fill: c.inkSecondary, size: 11, weight: 720,
      });
      drawCoefficientOrder(
        svg,
        right.x + right.w / 2,
        right.y + 142,
        order,
        basalValue,
        prismValue,
        c,
      );
      text(svg, "same illustrative σsurf = 0.20%", right.x + right.w / 2, right.y + 275, {
        fill: c.inkSecondary, size: 11.5, anchor: "middle",
      });
      text(svg, "alphaHK,prism ≈ " + prismValue.toFixed(3), right.x + right.w / 2,
        right.y + 298, {
          fill: c.inkSecondary, size: 11.5, anchor: "middle",
        });

      const modeText = state.surfaceMode === "history"
        ? "Following history: " + (state.pulse === "fast"
          ? "the fast pulse selects the narrow branch."
          : "the gentle start selects the broad branch.")
        : "Manual surface-state override: history is displayed but does not choose the branch.";
      status.textContent = modeText + " At the illustrative shared positive surface field, the " +
        BASAL[basalState].label + " gives restricted coefficient order " + order +
        ". Diagnostic only — not a habit boundary or habit classification; this is also not " +
        "a transition law, growth simulation, or aspect-ratio prediction.";
    }

    const pulseButtons = {};
    const stateButtons = {};

    function syncButtons() {
      Object.keys(pulseButtons).forEach(function (key) {
        pulseButtons[key].setAttribute("aria-pressed", String(state.pulse === key));
      });
      Object.keys(stateButtons).forEach(function (key) {
        stateButtons[key].setAttribute("aria-pressed", String(state.surfaceMode === key));
      });
    }

    function addGroupLabel(value) {
      const label = document.createElement("span");
      label.textContent = value;
      label.style.alignSelf = "center";
      label.style.fontWeight = "700";
      label.style.fontSize = "0.78rem";
      label.style.letterSpacing = "0.02em";
      label.style.color = "var(--ink-secondary)";
      controls.appendChild(label);
    }

    addGroupLabel("INITIAL HISTORY");
    pulseButtons.gentle = Viz.button(controls, "Gentle start", function () {
      state.pulse = "gentle";
      syncButtons();
      render();
    }, { pressed: true });
    pulseButtons.gentle.setAttribute("data-test-hook", "cm6-pulse-gentle");
    pulseButtons.gentle.dataset.control = "cm6-pulse-gentle";

    pulseButtons.fast = Viz.button(controls, "Initial fast-growth pulse", function () {
      state.pulse = "fast";
      syncButtons();
      render();
    }, { pressed: false });
    pulseButtons.fast.setAttribute("data-test-hook", "cm6-pulse-fast");
    pulseButtons.fast.dataset.control = "cm6-pulse-fast";

    addGroupLabel("BASAL STATE");
    stateButtons.history = Viz.button(controls, "Follow history", function () {
      state.surfaceMode = "history";
      syncButtons();
      render();
    }, { pressed: true });
    stateButtons.history.setAttribute("data-test-hook", "cm6-state-history");
    stateButtons.history.dataset.control = "cm6-state-history";

    stateButtons.broad = Viz.button(controls, "Force broad", function () {
      state.surfaceMode = "broad";
      syncButtons();
      render();
    }, { pressed: false });
    stateButtons.broad.setAttribute("data-test-hook", "cm6-state-broad");
    stateButtons.broad.dataset.control = "cm6-state-broad";

    stateButtons.narrow = Viz.button(controls, "Force narrow", function () {
      state.surfaceMode = "narrow";
      syncButtons();
      render();
    }, { pressed: false });
    stateButtons.narrow.setAttribute("data-test-hook", "cm6-state-narrow");
    stateButtons.narrow.dataset.control = "cm6-state-narrow";

    window.EducationTestHooks = window.EducationTestHooks || {};
    window.EducationTestHooks.cm6History = Object.freeze({
      evaluate: evaluate,
      semanticContract: Object.freeze({
        quantity: "restricted-alphaHK-order",
        constraint: "shared-positive-sigmaSurf-at-one-temperature",
        habitProxy: false,
      }),
      fixedSigmaSurfPercent: SIGMA_SURF,
      broadBasal: Object.freeze({ sigma0Percent: BASAL.broad.sigma0, A: 1 }),
      narrowBasal: Object.freeze({ sigma0Percent: BASAL.narrow.sigma0, A: 1 }),
      prismReference: Object.freeze({ sigma0Percent: PRISM.sigma0, A: PRISM.A }),
    });

    syncButtons();
    render();
    Viz.onThemeChange(render);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
