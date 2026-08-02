/* ============================================================================
   A parameter-order diagnostic — what two source curves do and do not imply
   ----------------------------------------------------------------------------
   ORIGINAL chart. Every curve is evaluated from a source equation rather than
   traced off a plotted line. For the dips, the source prints "log" without a
   base; this project registers a base-10 transcription as a P4 interpretation
   supported by the width shown in Figure 1. The equations as evaluated here and
   their citations:

     sigma0_basal broad   0.02 * t^1.75 + 0.3            [%]
                          arXiv:2009.08404v2, p. 3, Eq. (2)

     sigma0_prism broad   0.015 * t^2 + 0.02 * t^0.6     [%]
                          arXiv:2306.13087v1, p. 7  (the "M2" form)

     basal SDAK dip       1 - 0.87 * exp(-(log10 t - log10 4.5)^2 / 0.07)
                          arXiv:2306.13087v1, p. 6

     prism SDAK dip       1 - 0.95 * exp(-(log10 t - log10 14.4)^2 / 0.06)
                          arXiv:2306.13087v1, p. 6

   where t = (T_melt - T) is the supercooling in degrees Celsius, so t = 5
   means -5 C. The full "M1" parameterization is the broad curve times its dip.
   The exact dip shapes, depths, widths, and placements are P3
   Nakaya-informed model choices, not direct measurements of sigma0 on narrow
   facets. Base 10 is the project's registered transcription, not an explicit
   label in the source. Changing the base while changing both logarithms
   coherently cannot move either dip centre:
   they remain exactly 4.5 and 14.4 C. The values near 3.08, 8.07, and 24.73 C
   are equality roots of the two sigma0 curves, not dip centres.

   WHAT THE CHART IS FOR
   ---------------------
   sigma0 is an input to the Hertz-Knudsen attachment coefficient
   alphaHK = A * exp(-sigma0/sigma_surf). Comparing sigma0 alone says only
   which barrier is lower under the restricted assumption of equal A and the
   same positive sigma_surf. Comparing alphaHK at a chosen shared positive
   sigma_surf says which coefficient is larger under that artificial local
   comparison. Neither comparison labels a three-dimensional crystal as a
   plate or column. Habit is evaluated only from a complete 3-D forward run.

   The equality temperatures shown are computed here by bisection on the
   equations as transcribed above, not read from a plotted root. They are order-swap diagnostics,
   not habit boundaries.

   A SECOND CHART, mountAlphaHK() below, makes the dependence on A_prism and
   sigma_surf checkable: it compares alphaHK_basal and alphaHK_prism directly
   (Eqs. 1-5 of arXiv:2009.08404v2, p. 3), with a sigma_surf slider and an
   A_prism on/off toggle, instead of comparing sigma0 alone. See the comment
   above its own model functions for the equations and the units convention.
   ========================================================================= */

(function () {
  "use strict";

  /* ------------------------------------------------------------ the model */

  const sigma0BasalBroad = (t) => 0.02 * Math.pow(t, 1.75) + 0.3;
  const sigma0PrismBroad = (t) => 0.015 * t * t + 0.02 * Math.pow(t, 0.6);

  const basalDip = (t) =>
    1 - 0.87 * Math.exp(-Math.pow(Math.log10(t) - Math.log10(4.5), 2) / 0.07);
  const prismDip = (t) =>
    1 - 0.95 * Math.exp(-Math.pow(Math.log10(t) - Math.log10(14.4), 2) / 0.06);

  function sigma0(facet, t, withDips) {
    if (facet === "basal") {
      return sigma0BasalBroad(t) * (withDips ? basalDip(t) : 1);
    }
    return sigma0PrismBroad(t) * (withDips ? prismDip(t) : 1);
  }

  /** Supercoolings where the two sigma0 curves swap order. */
  function findCrossings(withDips, lo, hi) {
    const out = [];
    const f = (t) => sigma0("prism", t, withDips) - sigma0("basal", t, withDips);
    const step = 0.002;
    let prev = f(lo);
    for (let t = lo + step; t <= hi; t += step) {
      const cur = f(t);
      if (prev * cur < 0) {
        // bisect for a clean value
        let a = t - step, b = t;
        for (let k = 0; k < 60; k++) {
          const m = (a + b) / 2;
          if (f(a) * f(m) <= 0) b = m; else a = m;
        }
        out.push((a + b) / 2);
      }
      prev = cur;
    }
    return out;
  }

  /* ------------------------------------------------------- alphaHK model --
     Added to make the chapter's "Corrected" callout checkable: it claims
     that once the A prefactor is restored, alphaHK_basal and alphaHK_prism
     (not sigma0 alone) swap order THREE times at sigma_surf = 0.20%, near
     3.9, 5.0 and 10.6 degrees below freezing.

     Closed forms are Eqs. (1)-(5) of Libbrecht arXiv:2009.08404v2, printed
     p. 3, verified directly against research/2009.08404v2/page-0003.png:

       alphaHK_x(sigma_surf) = A_x * exp(-sigma0_x / sigma_surf)      Eq. (1)
       sigma0_basal(T*) = 0.02 T*^1.75 + 0.3                    [%]  Eq. (2)
       sigma0_prism(T*) = 0.02 T*^1.9 - 0.025(T* - 0.3)         [%]  Eq. (3)
       A_basal = 1                                                   Eq. (4)
       A_prism(T*) = (0.4 + 0.04|T*-4|^3) / (2.2 + 0.04|T*-4|^3)      Eq. (5)

     sigma0Basal above already IS Eq. (2) (both papers print the same basal
     curve, per the chapter text), so it is reused rather than duplicated.
     sigma0Prism2009 below is Eq. (3) — a DIFFERENT prism curve from
     sigma0PrismBroad above, which is the unrelated 2306.13087v1 "M2" form
     used by the sigma0-only chart. Do not conflate the two prism curves.

     UNITS: Figure 2's sigma0 axis is printed as "sigma0 (percent)", so
     sigma_surf must also be supplied in percent for sigma0/sigma_surf to be
     the dimensionless ratio the exponential expects — the chapter's own
     "sigma_surf = 0.20%" example is already in those units, and this file
     follows it (never a fraction like 0.0020). The acceptance check in
     findAlphaHKCrossings(0.20, true, 0, 30) below is what confirms that.
     ------------------------------------------------------------------- */

  const A_BASAL = 1;
  const sigma0Prism2009 = (t) => 0.02 * Math.pow(t, 1.9) - 0.025 * (t - 0.3);
  const aPrism = (t) => {
    const cube = 0.04 * Math.pow(Math.abs(t - 4), 3);
    return (0.4 + cube) / (2.2 + cube);
  };

  function alphaHKBasal(sigmaSurf, t) {
    return A_BASAL * Math.exp(-sigma0BasalBroad(t) / sigmaSurf);
  }
  function alphaHKPrism(sigmaSurf, t, includeAPrism) {
    const A = includeAPrism ? aPrism(t) : 1;
    return A * Math.exp(-sigma0Prism2009(t) / sigmaSurf);
  }

  /** Supercoolings where alphaHK_prism and alphaHK_basal swap order at the
   *  selected shared positive sigmaSurf. These are coefficient-equality roots,
   *  not habit boundaries. lo/hi default to 0-30 C below
   *  freezing, a range wide enough to hold every crossing this chapter
   *  discusses. */
  function findAlphaHKCrossings(sigmaSurf, includeAPrism, lo, hi) {
    const T_LO = lo == null ? 0 : lo;
    const T_HI = hi == null ? 30 : hi;
    const out = [];
    const f = (t) => alphaHKPrism(sigmaSurf, t, includeAPrism) - alphaHKBasal(sigmaSurf, t);
    const step = 0.01;
    let prev = f(T_LO);
    for (let t = T_LO + step; t <= T_HI + 1e-9; t += step) {
      const cur = f(t);
      if (prev * cur < 0) {
        let a = t - step, b = t;
        for (let k = 0; k < 60; k++) {
          const m = (a + b) / 2;
          if (f(a) * f(m) <= 0) b = m; else a = m;
        }
        out.push((a + b) / 2);
      }
      prev = cur;
    }
    return out;
  }

  /* --------------------------------------------------------------- mount */

  /**
   *   Sigma0.mount(root, { withDips: true, showHabitStrip: true })
   *
   * showHabitStrip is a retained API name. The rendered strip shows parameter
   * order only; it never assigns morphology.
   */
  function mount(root, options) {
    const o = Object.assign({ withDips: true, showHabitStrip: true }, options || {});

    const body = root.querySelector(".anim__body") || root;
    const bar = root.querySelector(".anim__controls");

    const W = 760, H = 460;
    const M = { top: 44, right: 64, bottom: 118, left: 70 };
    const plot = { x0: M.left, x1: W - M.right, y0: H - M.bottom, y1: M.top };

    const T_LO = 1, T_HI = 40;
    const xs = Viz.scaleLinear([T_LO, T_HI], [plot.x0, plot.x1]);
    const ys = Viz.scaleLog([0.02, 20], [plot.y0, plot.y1]);

    let withDips = o.withDips;
    let svg = null;

    // A legend is always present for two series, and both are direct-labelled
    // on the plot as well — identity is never carried by colour alone.
    const head = root.querySelector(".anim__head") || body;
    const legendBox = document.createElement("div");
    legendBox.className = "legend";
    head.appendChild(legendBox);

    const status = document.createElement("p");
    status.className = "anim__sub";
    status.setAttribute("role", "status");
    status.style.fontWeight = "600";
    status.style.marginTop = "0.35rem";
    head.appendChild(status);

    function paintLegend() {
      const c = Viz.colors();
      legendBox.textContent = "";
      legendBox.style.padding = "0.5rem 0 0";
      [
        { color: c.series[0], label: "Basal — the flat top and bottom" },
        { color: c.series[1], label: "Prism — the six side faces" },
      ].forEach(function (item) {
        const wrap = document.createElement("span");
        wrap.className = "legend__item";
        const sw = document.createElement("span");
        sw.className = "legend__swatch";
        sw.style.background = item.color;
        wrap.appendChild(sw);
        wrap.appendChild(document.createTextNode(item.label));
        legendBox.appendChild(wrap);
      });
    }

    function render() {
      if (svg) svg.remove();
      const c = Viz.colors();

      svg = Viz.createSvg(body, W, H, {
        label:
          "The adopted basal and prism nucleation-barrier inputs against temperature. " +
          "Crossings mark equality of these two inputs, not a change of three-dimensional habit.",
      });

      const basal = [], prism = [];
      for (let t = T_LO; t <= T_HI; t += 0.05) {
        basal.push([t, sigma0("basal", t, withDips)]);
        prism.push([t, sigma0("prism", t, withDips)]);
      }

      const cross = findCrossings(withDips, T_LO, T_HI);

      /* ---- parameter-order strip, placed below the ticks ---- */
      const STRIP_Y = plot.y0 + 34;
      if (o.showHabitStrip) {
        const edges = [T_LO, ...cross, T_HI];
        for (let i = 0; i < edges.length - 1; i++) {
          const a = edges[i], b = edges[i + 1];
          const mid = (a + b) / 2;
          const basalLower = sigma0("basal", mid, withDips) < sigma0("prism", mid, withDips);
          const ink = basalLower ? c.series[0] : c.series[1];
          svg.appendChild(Viz.svgEl("rect", {
            x: xs(a), y: STRIP_Y, width: xs(b) - xs(a), height: 22,
            fill: ink, "fill-opacity": 0.24, stroke: c.surface, "stroke-width": 2,
          }));
          if (xs(b) - xs(a) > 42) {
            const label = Viz.svgEl("text", {
              x: (xs(a) + xs(b)) / 2, y: STRIP_Y + 15,
              "text-anchor": "middle", fill: ink, "font-size": 11, "font-weight": 620,
              "font-family": "var(--font-sans)",
            });
            label.textContent = basalLower ? "basal lower" : "prism lower";
            svg.appendChild(label);
          }
        }
        const stripTitle = Viz.svgEl("text", {
          x: plot.x0 - 10, y: STRIP_Y + 15, "text-anchor": "end",
          fill: c.inkSecondary, "font-size": 11, "font-weight": 620,
          "font-family": "var(--font-sans)",
        });
        stripTitle.textContent = "σ₀ order";
        svg.appendChild(stripTitle);
      }

      /* ---- axes ---- */
      Viz.axisLeft(svg, ys, {
        x: plot.x0, values: [0.02, 0.1, 1, 10], grid: true, gridTo: plot.x1,
        title: "How hard the face is to grow  (σ₀, %)",
        format: (v) => (v < 1 ? String(v) : String(v)),
      });
      Viz.axisBottom(svg, xs, {
        y: plot.y0, values: [1, 5, 10, 15, 20, 25, 30, 35, 40],
        format: (v) => "−" + v,
        title: "Temperature (°C)",
        titleOffset: 88,
      });

      /* ---- crossings. Labels run vertically so close crossings never collide -- */
      cross.forEach(function (t) {
        svg.appendChild(Viz.svgEl("line", {
          x1: xs(t), x2: xs(t), y1: plot.y0, y2: plot.y1 - 4,
          stroke: c.inkSecondary, "stroke-width": 1.2, "stroke-dasharray": "4 4",
        }));
        svg.appendChild(Viz.svgEl("circle", {
          cx: xs(t), cy: ys(sigma0("basal", t, withDips)), r: 5,
          fill: c.surface, stroke: c.inkSecondary, "stroke-width": 2,
        }));
        const tag = Viz.svgEl("text", {
          x: xs(t), y: plot.y1 - 8, "text-anchor": "start",
          transform: `rotate(-90 ${xs(t)} ${plot.y1 - 8})`,
          fill: c.inkSecondary, "font-size": 10.5, "font-weight": 620,
          "font-family": "var(--font-sans)",
        });
        tag.textContent = "−" + t.toFixed(1) + "°C";
        svg.appendChild(tag);
      });

      /* ---- the two curves. Labels sit ABOVE the line ends, inside the plot,
              so they can never be clipped by the right edge. ---- */
      const endBasal = basal[basal.length - 1];
      const endPrism = prism[prism.length - 1];
      Viz.series(svg, basal, xs, ys, {
        color: c.series[0], label: "Basal",
        labelAt: endBasal, labelDx: -4, labelDy: 18, labelAnchor: "end",
      });
      Viz.series(svg, prism, xs, ys, {
        color: c.series[1], label: "Prism",
        labelAt: endPrism, labelDx: -4, labelDy: -10, labelAnchor: "end",
      });

      paintLegend();
      status.textContent = withDips
        ? cross.length + " sigma0-equality roots. The separate dip centres remain −4.5 °C and " +
          "−14.4 °C under log10 or ln. Diagnostic only — not a habit boundary or habit classification."
        : "One sigma0-equality root for these broad curves. This restricted input comparison " +
          "does not bound or predict the number of three-dimensional habit changes. " +
          "Diagnostic only — not a habit boundary or habit classification.";
    }

    if (bar) {
      Viz.button(bar, withDips ? "Hide the two dips" : "Add the two dips", function (b) {
        withDips = !withDips;
        b.textContent = withDips ? "Hide the two dips" : "Add the two dips";
        b.setAttribute("aria-pressed", String(withDips));
        render();
      }, { pressed: withDips });

      const note = document.createElement("span");
      note.className = "control";
      note.style.color = "var(--ink-muted)";
      note.textContent = "This strip compares sigma0 only. It assumes equal A and says nothing "
        + "by itself about the morphology produced by a 3-D forward run.";
      bar.appendChild(note);
    }

    render();
    Viz.onThemeChange(render);
    return { render: render, findCrossings: findCrossings, sigma0: sigma0 };
  }

  /* ------------------------------------------------------- mount alphaHK */

  /**
   *   Sigma0.mountAlphaHK(root, { sigmaSurf: 0.20, includeAPrism: true })
   *
   * Unlike mount() above, this compares the full attachment coefficient
   * alphaHK = A exp(-sigma0/sigma_surf), not sigma0 alone, so both the A
   * prefactor (Eq. 5) and the reader's own sigma_surf choice feed into the
   * equality-root count. That count is conditional on sigma_surf and is not a
   * fixed property of the two barrier curves or a morphology prediction.
   */
  function mountAlphaHK(root, options) {
    const o = Object.assign({ sigmaSurf: 0.20, includeAPrism: true }, options || {});

    const body = root.querySelector(".anim__body") || root;
    const bar = root.querySelector(".anim__controls");
    const head = root.querySelector(".anim__head") || body;

    const W = 760, H = 460;
    const M = { top: 44, right: 64, bottom: 118, left: 74 };
    const plot = { x0: M.left, x1: W - M.right, y0: H - M.bottom, y1: M.top };

    const T_LO = 0, T_HI = 30;
    const Y_FLOOR = 0.000001, Y_CEIL = 1.3;
    const xs = Viz.scaleLinear([T_LO, T_HI], [plot.x0, plot.x1]);
    const ys = Viz.scaleLog([Y_FLOOR, Y_CEIL], [plot.y0, plot.y1]);
    const clampY = (v) => Math.max(Y_FLOOR, Math.min(Y_CEIL, v));

    let sigmaSurf = o.sigmaSurf;
    let includeAPrism = o.includeAPrism;
    let svg = null, lastCrossings = [], sigmaSlider = null, aPrismButton = null;

    const legendBox = document.createElement("div");
    legendBox.className = "legend";
    head.appendChild(legendBox);

    const status = document.createElement("p");
    status.className = "anim__sub";
    status.setAttribute("role", "status");
    status.style.fontWeight = "600";
    status.style.marginTop = "0.35rem";
    head.appendChild(status);

    function paintLegend() {
      const c = Viz.colors();
      legendBox.textContent = "";
      legendBox.style.padding = "0.5rem 0 0";
      [
        { color: c.series[0], label: "alphaHK, basal" },
        { color: c.series[1], label: "alphaHK, prism" },
      ].forEach(function (item) {
        const wrap = document.createElement("span");
        wrap.className = "legend__item";
        const sw = document.createElement("span");
        sw.className = "legend__swatch";
        sw.style.background = item.color;
        wrap.appendChild(sw);
        wrap.appendChild(document.createTextNode(item.label));
        legendBox.appendChild(wrap);
      });
    }

    function render() {
      if (svg) svg.remove();
      const c = Viz.colors();

      svg = Viz.createSvg(body, W, H, {
        label:
          "The Hertz-Knudsen attachment coefficients for the basal and prism facets at one " +
          "chosen, shared positive surface supersaturation. A crossing is coefficient equality, " +
          "not a three-dimensional habit boundary.",
      });

      const basal = [], prism = [];
      for (let t = T_LO; t <= T_HI; t += 0.05) {
        basal.push([t, clampY(alphaHKBasal(sigmaSurf, t))]);
        prism.push([t, clampY(alphaHKPrism(sigmaSurf, t, includeAPrism))]);
      }

      const cross = findAlphaHKCrossings(sigmaSurf, includeAPrism, T_LO, T_HI);
      lastCrossings = cross;

      /* ---- coefficient-order strip, placed below the ticks ---- */
      const STRIP_Y = plot.y0 + 34;
      const edges = [T_LO, ...cross, T_HI];
      for (let i = 0; i < edges.length - 1; i++) {
        const a = edges[i], b = edges[i + 1];
        const mid = (a + b) / 2;
        const basalWins = alphaHKBasal(sigmaSurf, mid) > alphaHKPrism(sigmaSurf, mid, includeAPrism);
        const ink = basalWins ? c.series[0] : c.series[1];
        svg.appendChild(Viz.svgEl("rect", {
          x: xs(a), y: STRIP_Y, width: Math.max(1, xs(b) - xs(a)), height: 22,
          fill: ink, "fill-opacity": 0.24, stroke: c.surface, "stroke-width": 2,
        }));
        if (xs(b) - xs(a) > 42) {
          const label = Viz.svgEl("text", {
            x: (xs(a) + xs(b)) / 2, y: STRIP_Y + 15,
            "text-anchor": "middle", fill: ink, "font-size": 11, "font-weight": 620,
            "font-family": "var(--font-sans)",
          });
          label.textContent = basalWins ? "basal larger" : "prism larger";
          svg.appendChild(label);
        }
      }
      const stripTitle = Viz.svgEl("text", {
        x: plot.x0 - 10, y: STRIP_Y + 15, "text-anchor": "end",
        fill: c.inkSecondary, "font-size": 11, "font-weight": 620,
        "font-family": "var(--font-sans)",
      });
      stripTitle.textContent = "alphaHK order";
      svg.appendChild(stripTitle);

      /* ---- axes ---- */
      Viz.axisLeft(svg, ys, {
        x: plot.x0, values: [0.000001, 0.0001, 0.01, 1], grid: true, gridTo: plot.x1,
        title: "Attachment coefficient (alphaHK)",
        format: (v) => (v >= 0.01 ? String(v) : v.toExponential(0)),
      });
      Viz.axisBottom(svg, xs, {
        y: plot.y0, values: [0, 5, 10, 15, 20, 25, 30],
        format: (v) => (v === 0 ? "0" : "−" + v),
        title: "Temperature (°C)",
        titleOffset: 88,
      });

      /* ---- crossings. Labels run vertically so close crossings never collide -- */
      cross.forEach(function (t) {
        svg.appendChild(Viz.svgEl("line", {
          x1: xs(t), x2: xs(t), y1: plot.y0, y2: plot.y1 - 4,
          stroke: c.inkSecondary, "stroke-width": 1.2, "stroke-dasharray": "4 4",
        }));
        svg.appendChild(Viz.svgEl("circle", {
          cx: xs(t), cy: ys(clampY(alphaHKBasal(sigmaSurf, t))), r: 5,
          fill: c.surface, stroke: c.inkSecondary, "stroke-width": 2,
        }));
        const tag = Viz.svgEl("text", {
          x: xs(t), y: plot.y1 - 8, "text-anchor": "start",
          transform: `rotate(-90 ${xs(t)} ${plot.y1 - 8})`,
          fill: c.inkSecondary, "font-size": 10.5, "font-weight": 620,
          "font-family": "var(--font-sans)",
        });
        tag.textContent = "−" + t.toFixed(1) + "°C";
        svg.appendChild(tag);
      });

      /* ---- the two curves ---- */
      const endBasal = basal[basal.length - 1];
      const endPrism = prism[prism.length - 1];
      Viz.series(svg, basal, xs, ys, {
        color: c.series[0], label: "Basal",
        labelAt: endBasal, labelDx: -4, labelDy: 18, labelAnchor: "end",
      });
      Viz.series(svg, prism, xs, ys, {
        color: c.series[1], label: "Prism",
        labelAt: endPrism, labelDx: -4, labelDy: -10, labelAnchor: "end",
      });

      paintLegend();
      status.textContent = cross.length + " coefficient-equality root" + (cross.length === 1 ? "" : "s") +
        " at shared positive σ_surf = " + sigmaSurf.toFixed(2) + "%, " +
        (includeAPrism ? "A_prism included" : "A held at 1") +
        (cross.length ? ": " + cross.map((t) => "−" + t.toFixed(1) + "°C").join(", ") : "") +
        ". Diagnostic only — not a habit boundary or habit classification.";
    }

    if (bar) {
      sigmaSlider = Viz.slider(bar, {
        label: "Spare vapour σ_surf", id: "alphaHK-sigma-surf",
        min: 0.05, max: 2, step: 0.01, value: sigmaSurf,
        format: (v) => v.toFixed(2) + " %",
        onInput: function (v) { sigmaSurf = v; render(); },
      });
      aPrismButton = Viz.button(bar,
        includeAPrism ? "Hold A ≡ 1 (restricted comparison)" : "Include source-fit A_prism",
        function (b) {
          includeAPrism = !includeAPrism;
          b.textContent = includeAPrism ? "Hold A ≡ 1 (restricted comparison)" : "Include source-fit A_prism";
          b.setAttribute("aria-pressed", String(includeAPrism));
          render();
        }, { pressed: includeAPrism });
    }

    render();
    Viz.onThemeChange(render);
    return {
      render: render,
      getCrossings: function () { return lastCrossings.slice(); },
      getSigmaSurf: function () { return sigmaSurf; },
      getIncludeAPrism: function () { return includeAPrism; },
      setSigmaSurf: function (v) {
        if (sigmaSlider) sigmaSlider.value = v; else { sigmaSurf = v; render(); }
      },
      setIncludeAPrism: function (v) {
        if (Boolean(v) !== includeAPrism && aPrismButton) aPrismButton.click();
        else { includeAPrism = Boolean(v); render(); }
      },
    };
  }

  window.EducationTestHooks = window.EducationTestHooks || {};
  window.EducationTestHooks.sigma0 = Object.freeze({
    schemaVersion: 1,
    semanticContract: Object.freeze({
      quantity: "coefficient-order-diagnostic",
      habitBoundary: false,
      habitClassification: false,
      habitProxy: false,
      dipLogBase: 10,
    }),
    constants: Object.freeze({
      basalCentreC: 4.5,
      prismCentreC: 14.4,
      basalDepth: 0.87,
      prismDepth: 0.95,
      basalWidth: 0.07,
      prismWidth: 0.06,
    }),
    evaluate: function (t, withDips, sigmaSurf, includeAPrism) {
      return Object.freeze({
        basalBroad: sigma0BasalBroad(t),
        prismBroad: sigma0PrismBroad(t),
        basalDip: basalDip(t),
        prismDip: prismDip(t),
        basalSigma0: sigma0("basal", t, withDips),
        prismSigma0: sigma0("prism", t, withDips),
        basalAlphaHK: alphaHKBasal(sigmaSurf, t),
        prismAlphaHK: alphaHKPrism(sigmaSurf, t, includeAPrism),
      });
    },
    sigma0Crossings: findCrossings,
    alphaHKCrossings: findAlphaHKCrossings,
  });

  window.Sigma0 = {
    mount: mount,
    mountAlphaHK: mountAlphaHK,
    sigma0: sigma0,
    findCrossings: findCrossings,
    sigma0BasalBroad: sigma0BasalBroad,
    sigma0PrismBroad: sigma0PrismBroad,
    basalDip: basalDip,
    prismDip: prismDip,
    sigma0Prism2009: sigma0Prism2009,
    aPrism: aPrism,
    A_BASAL: A_BASAL,
    alphaHKBasal: alphaHKBasal,
    alphaHKPrism: alphaHKPrism,
    findAlphaHKCrossings: findAlphaHKCrossings,
  };
})();
