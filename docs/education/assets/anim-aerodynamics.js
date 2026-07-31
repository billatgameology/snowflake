/* ============================================================================
   Falling snow-crystal aerodynamics — a deliberately nonpredictive explorer.

   Sources: Libbrecht, Snow Crystals, section 3.7, printed pp. 108-111.
   The ventilation-factor approximation is printed Eq. 3.53:
       f_v ~= 1 + 0.1 Re          (Re < 1)
       f_v ~= 0.8 + 0.3 sqrt(Re) (Re > 1)
   It is a spherical transport estimate. The source separately estimates about
   a 25% tip-speed increase for one mature fernlike dendrite at terminal fall.
   ========================================================================== */

(function () {
  "use strict";

  const root = document.getElementById("anim-aerodynamics");
  if (!root || !window.Viz) return;

  const body = root.querySelector(".anim__body");
  const controls = root.querySelector(".anim__controls");
  const head = root.querySelector(".anim__head");

  let morphology = "plate";
  let sizeMm = 0.45;
  let logReynolds = -0.3;
  let svg = null;

  const status = document.createElement("p");
  status.className = "anim__sub";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.style.fontWeight = "600";
  head.appendChild(status);

  function ventilationFactor(reynolds) {
    const re = Math.max(0, Number(reynolds));
    return re < 1 ? 1 + 0.1 * re : 0.8 + 0.3 * Math.sqrt(re);
  }

  function orientationFor(size, kind) {
    if (size < 0.1) return "turbulence-dominated";
    if (size <= 1) return kind === "plate" ? "basal-horizontal" : "c-axis-horizontal";
    return "flutter-or-tumble";
  }

  function evaluate(kind, size, reynolds) {
    const orientation = orientationFor(Number(size), kind);
    return {
      morphology: kind,
      sizeMm: Number(size),
      reynolds: Number(reynolds),
      ventilationFactor: ventilationFactor(reynolds),
      orientation: orientation,
      formulaBranch: Number(reynolds) < 1 ? "low-Re" : "high-Re",
    };
  }

  function crystalPath(cx, cy, kind, orientation) {
    const tilted = orientation === "turbulence-dominated" ? -27 :
      orientation === "flutter-or-tumble" ? 20 : 0;
    if (kind === "plate") {
      return {
        d: "M " + (cx - 92) + " " + (cy - 9) +
           " L " + (cx + 92) + " " + (cy - 9) +
           " L " + (cx + 92) + " " + (cy + 9) +
           " L " + (cx - 92) + " " + (cy + 9) + " Z",
        transform: "rotate(" + tilted + " " + cx + " " + cy + ")",
      };
    }
    const columnTilt = orientation === "c-axis-horizontal" ? 0 : tilted || 25;
    return {
      d: "M " + (cx - 78) + " " + (cy - 19) +
         " L " + (cx + 78) + " " + (cy - 19) +
         " L " + (cx + 78) + " " + (cy + 19) +
         " L " + (cx - 78) + " " + (cy + 19) + " Z",
      transform: "rotate(" + columnTilt + " " + cx + " " + cy + ")",
    };
  }

  function render() {
    const c = Viz.colors();
    const reynolds = Math.pow(10, logReynolds);
    const result = evaluate(morphology, sizeMm, reynolds);
    const W = 720;
    const H = 350;
    const cx = 300;
    const cy = 165;

    if (svg) svg.remove();
    svg = Viz.createSvg(body, W, H, {
      label:
        "A conceptual falling snow crystal with relative airflow, its expected orientation class, " +
        "and the source's spherical ventilation-factor estimate.",
      desc:
        "Plates in the middle size band align with their basal faces horizontal, while columns " +
        "align their long c axis horizontally. Very small crystals follow turbulence; large ones " +
        "may flutter or tumble. Relative airflow increases diffusive delivery.",
    });

    svg.appendChild(Viz.svgEl("rect", {
      x: 20, y: 24, width: 545, height: 276, rx: 12,
      fill: c.sunken, stroke: c.rule, "stroke-width": 1,
    }));

    for (let k = 0; k < 7; k++) {
      const x = 70 + k * 73;
      const offset = 9 * Math.sin(k * 1.7);
      svg.appendChild(Viz.svgEl("path", {
        d: "M " + x + " 274 C " + (x + offset) + " 240 " +
           (x - offset) + " 94 " + x + " 56",
        fill: "none", stroke: c.series[2], "stroke-width": 1.8,
        "stroke-linecap": "round", opacity: 0.72,
      }));
      svg.appendChild(Viz.svgEl("path", {
        d: "M " + (x - 5) + " 66 L " + x + " 56 L " + (x + 5) + " 66",
        fill: "none", stroke: c.series[2], "stroke-width": 1.8,
      }));
    }

    const shape = crystalPath(cx, cy, morphology, result.orientation);
    svg.appendChild(Viz.svgEl("path", {
      d: shape.d,
      transform: shape.transform,
      fill: c.series[0], "fill-opacity": 0.25,
      stroke: c.series[0], "stroke-width": 2.4, "stroke-linejoin": "round",
    }));
    if (morphology === "plate") {
      svg.appendChild(Viz.svgEl("line", {
        x1: cx, x2: cx, y1: cy - 46, y2: cy + 46,
        transform: shape.transform,
        stroke: c.series[1], "stroke-width": 2, "stroke-dasharray": "3 3",
      }));
    } else {
      svg.appendChild(Viz.svgEl("line", {
        x1: cx - 65, x2: cx + 65, y1: cy, y2: cy,
        transform: shape.transform,
        stroke: c.series[1], "stroke-width": 2, "stroke-dasharray": "3 3",
      }));
    }

    const flowLabel = Viz.svgEl("text", {
      class: "series-label", x: 42, y: 48, fill: c.series[2],
    });
    flowLabel.textContent = "airflow relative to the falling crystal";
    svg.appendChild(flowLabel);

    const orientLabel = Viz.svgEl("text", {
      class: "series-label", x: cx, y: 226, "text-anchor": "middle", fill: c.series[0],
    });
    orientLabel.textContent =
      result.orientation === "basal-horizontal" ? "plate: basal faces roughly horizontal" :
      result.orientation === "c-axis-horizontal" ? "column: c axis roughly horizontal" :
      result.orientation === "turbulence-dominated" ? "too small for reliable alignment" :
      "large-crystal flutter or tumble becomes important";
    svg.appendChild(orientLabel);

    const x0 = 598;
    const barBottom = 272;
    const barMax = 190;
    const factorScaleMax = 4;
    const baselineH = barMax / factorScaleMax;
    const ventilatedH = result.ventilationFactor * barMax / factorScaleMax;
    svg.appendChild(Viz.svgEl("rect", {
      x: x0, y: barBottom - baselineH, width: 32, height: baselineH,
      fill: c.muted, "fill-opacity": 0.45,
      "data-role": "still-air-bar",
    }));
    svg.appendChild(Viz.svgEl("rect", {
      x: x0 + 52, y: barBottom - ventilatedH, width: 32, height: ventilatedH,
      fill: c.series[1], "fill-opacity": 0.72,
      "data-role": "ventilated-air-bar",
    }));
    [
      { x: x0 + 16, text: "still" },
      { x: x0 + 68, text: "flow" },
    ].forEach(function (item) {
      const label = Viz.svgEl("text", {
        class: "tick-text", x: item.x, y: barBottom + 17,
        "text-anchor": "middle", fill: c.inkSecondary,
      });
      label.textContent = item.text;
      svg.appendChild(label);
    });
    const factorLabel = Viz.svgEl("text", {
      class: "series-label", x: x0 + 42, y: 48,
      "text-anchor": "middle", fill: c.series[1],
    });
    factorLabel.textContent = "f_v = " + result.ventilationFactor.toFixed(2);
    svg.appendChild(factorLabel);

    root.dataset.morphology = result.morphology;
    root.dataset.sizeMm = result.sizeMm.toFixed(3);
    root.dataset.reynolds = result.reynolds.toFixed(6);
    root.dataset.ventilationFactor = result.ventilationFactor.toFixed(9);
    root.dataset.orientationClass = result.orientation;
    root.dataset.formulaBranch = result.formulaBranch;
    root.dataset.predictive = "false";

    const increase = (result.ventilationFactor - 1) * 100;
    const orientation =
      result.orientation === "basal-horizontal" ? "a plate in the basal-horizontal class" :
      result.orientation === "c-axis-horizontal" ? "a column in the c-axis-horizontal class" :
      result.orientation === "turbulence-dominated" ? "a small, turbulence-dominated crystal" :
      "a large crystal in the flutter-or-tumble class";
    status.textContent =
      "At " + result.sizeMm.toFixed(2) + " mm, this qualitative guide shows " + orientation +
      ". At Re = " + result.reynolds.toFixed(result.reynolds < 0.1 ? 3 : 2) +
      ", the source's spherical estimate gives f_v = " +
      result.ventilationFactor.toFixed(2) + ", about " + increase.toFixed(1) +
      "% more diffusive delivery. This is a transport illustration, not a snow-crystal shape predictor.";
  }

  const kindWrap = document.createElement("div");
  kindWrap.className = "control";
  const kindLabel = document.createElement("span");
  kindLabel.textContent = "Falling shape:";
  kindLabel.style.fontWeight = "600";
  kindWrap.appendChild(kindLabel);
  controls.appendChild(kindWrap);

  const plateButton = Viz.button(kindWrap, "Plate", function () {
    morphology = "plate";
    syncButtons();
    render();
  }, { pressed: true });
  plateButton.dataset.morphology = "plate";

  const columnButton = Viz.button(kindWrap, "Column", function () {
    morphology = "column";
    syncButtons();
    render();
  }, { pressed: false });
  columnButton.dataset.morphology = "column";

  function syncButtons() {
    plateButton.setAttribute("aria-pressed", String(morphology === "plate"));
    columnButton.setAttribute("aria-pressed", String(morphology === "column"));
  }

  const sizeControl = Viz.slider(controls, {
    label: "Overall size",
    id: "aero-size",
    min: 0.02,
    max: 2,
    step: 0.01,
    value: sizeMm,
    format: function (v) { return v.toFixed(2) + " mm"; },
    onInput: function (v) {
      sizeMm = v;
      render();
    },
  });
  sizeControl.input.dataset.control = "size-mm";

  const reControl = Viz.slider(controls, {
    label: "Relative-flow Reynolds number",
    id: "aero-reynolds",
    min: -2,
    max: 2,
    step: 0.05,
    value: logReynolds,
    format: function (v) {
      const re = Math.pow(10, v);
      return "Re = " + re.toFixed(re < 0.1 ? 3 : re < 10 ? 2 : 0);
    },
    onInput: function (v) {
      logReynolds = v;
      render();
    },
  });
  reControl.input.dataset.control = "log10-reynolds";

  window.EducationTestHooks = window.EducationTestHooks || {};
  window.EducationTestHooks.aerodynamics = Object.freeze({
    evaluate: evaluate,
    ventilationFactor: ventilationFactor,
  });

  syncButtons();
  render();
  Viz.onThemeChange(render);
})();
