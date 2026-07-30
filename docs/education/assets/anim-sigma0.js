/* ============================================================================
   The crossing explanation — why the Nakaya diagram looks the way it does
   ----------------------------------------------------------------------------
   ORIGINAL chart. Every curve is EVALUATED FROM A PRINTED EQUATION, never
   traced off a plotted line. The equations and their citations:

     sigma0_basal broad   0.02 * t^1.75 + 0.3            [%]
                          arXiv:2009.08404v2, p. 3, Eq. (2)

     sigma0_prism broad   0.015 * t^2 + 0.02 * t^0.6     [%]
                          arXiv:2306.13087v1, p. 7  (the "M2" form)

     basal SDAK dip       1 - 0.87 * exp(-(log10 t - log10 4.5)^2 / 0.07)
                          arXiv:2306.13087v1, p. 6

     prism SDAK dip       1 - 0.95 * exp(-(log10 t - log10 14.4)^2 / 0.06)
                          arXiv:2306.13087v1, p. 6

   where t = (T_melt - T) is the supercooling in degrees Celsius, so t = 5
   means -5 C. The full "M1" model is the broad curve times its dip. CORRECTED
   2026-07-29: the printed log in both dip formulas is BASE 10, not natural —
   this file used Math.log (natural) until then, which gave five crossings
   instead of the three below. See app/scripts/phase6-libbrecht-closed-forms.mjs.

   WHAT THE CHART IS FOR
   ---------------------
   sigma0 is how hard it is to start a new layer on a facet. A SMALLER sigma0
   means that face grows MORE easily, PROVIDED the two facets' A prefactors in
   alphaHK = A * exp(-sigma0/sigma_surf) are equal — which they are not always
   (see core/src/libbrecht.ts and Chapter 12's own equation gloss). With that
   proviso, whichever curve is lower is the face that wins:

     basal lower  -> the top and bottom faces grow  -> the crystal gets taller -> COLUMN
     prism lower  -> the six side faces grow        -> the crystal spreads     -> PLATE

   A habit boundary happens where the two curves cross, ON THIS SIMPLIFIED
   READING. It is not a hard structural limit on how many habit changes a
   broad-facet model can produce: an earlier version of this comment claimed
   that, and an adversarial review in 2026 found it wrong — habit is actually
   set by the full alphaHK, not sigma0 alone, and once the A prefactor is
   restored the swap count depends on sigma_surf and can reach three even
   without the dips (research/libbrecht-figure-findings.md). The two dips still
   matter, as the measured, independently-motivated mechanism this chapter
   discusses — just not because sigma0-alone crossings are a proven ceiling.

   The crossing temperatures shown are computed here by bisection on those
   printed equations, not read off anything.
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

  /** Supercoolings where the two curves swap order — i.e. habit boundaries. */
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

  /* --------------------------------------------------------------- mount */

  /**
   *   Sigma0.mount(root, { withDips: true, showHabitStrip: true })
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
          "How hard it is to grow each face of an ice crystal, against how far below freezing " +
          "the air is. Where the two lines cross, the crystal switches between growing as a " +
          "plate and growing as a column.",
      });

      const basal = [], prism = [];
      for (let t = T_LO; t <= T_HI; t += 0.05) {
        basal.push([t, sigma0("basal", t, withDips)]);
        prism.push([t, sigma0("prism", t, withDips)]);
      }

      const cross = findCrossings(withDips, T_LO, T_HI);

      /* ---- habit strip, placed BELOW the axis ticks so nothing collides ---- */
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
            label.textContent = basalLower ? "column" : "plate";
            svg.appendChild(label);
          }
        }
        const stripTitle = Viz.svgEl("text", {
          x: plot.x0 - 10, y: STRIP_Y + 15, "text-anchor": "end",
          fill: c.inkSecondary, "font-size": 11, "font-weight": 620,
          "font-family": "var(--font-sans)",
        });
        stripTitle.textContent = "you get";
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
        ? cross.length + " crossings from the sigma0-alone comparison — matching the Nakaya " +
          "diagram's three boundaries in count, though not exactly in place (see the chapter text)."
        : "Only one sigma0 crossing, at −" + cross[0].toFixed(1) + " °C — but sigma0 alone " +
          "isn't quite the right thing to compare (see the chapter text), so this is not proof " +
          "that a broad-facet model can only flip habit once.";
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
      note.textContent = "Without the dips the two sigma0 curves cross once — but that count "
        + "assumes the two facets' A prefactors are equal, which they are not always.";
      bar.appendChild(note);
    }

    render();
    Viz.onThemeChange(render);
    return { render: render, findCrossings: findCrossings, sigma0: sigma0 };
  }

  window.Sigma0 = {
    mount: mount,
    sigma0: sigma0,
    findCrossings: findCrossings,
    sigma0BasalBroad: sigma0BasalBroad,
    sigma0PrismBroad: sigma0PrismBroad,
    basalDip: basalDip,
    prismDip: prismDip,
  };
})();
