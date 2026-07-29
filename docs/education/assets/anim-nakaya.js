/* ============================================================================
   The Nakaya morphology diagram — interactive, original redraw
   ----------------------------------------------------------------------------
   This is OUR drawing, not a scan. It encodes:

     - Habit-boundary temperatures -3.3, -9.9 and -21.5 C, measured from
       Libbrecht, "Toward a Comprehensive Model of Snow Crystal Growth
       Dynamics: 1" (arXiv:1211.5555v1), Figure 1, printed p. 2. The reading
       method and its +/-0.5 C uncertainty are recorded in
       research/nakaya-morphology-diagram.md.
     - The band sequence plates | columns | plates | columns-and-plates, which
       is the figure's own printed labelling and matches its caption.
     - A water-saturation line computed from Murphy & Koop (2005) rather than
       traced off the figure. The traced line runs 30-42% low against that
       standard (same file, Result 2), so redrawing it from the physics is both
       more correct and more honest than copying the picture.

   Nothing here is digitized off a plotted curve. The only numbers taken from
   the figure are the three boundary temperatures, which are positions of
   printed dashed lines, not readings of a data curve.
   ========================================================================= */

(function () {
  "use strict";

  /* ------------------------------------------------- vapour thermodynamics */

  /** Saturation vapour pressure over ice, Pa. Murphy & Koop (2005) Eq. 7. */
  function pSatIce(T) {
    return Math.exp(
      9.550426 - 5723.265 / T + 3.53068 * Math.log(T) - 0.00728332 * T
    );
  }

  /** Saturation vapour pressure over supercooled water, Pa. Murphy & Koop (2005) Eq. 10. */
  function pSatWater(T) {
    return Math.exp(
      54.842763 - 6763.22 / T - 4.210 * Math.log(T) + 0.000367 * T +
      Math.tanh(0.0415 * (T - 218.8)) *
        (53.878 - 1331.22 / T - 9.44523 * Math.log(T) + 0.014025 * T)
    );
  }

  /**
   * Excess water-vapour density of water-saturated air over ice saturation,
   * in g/m^3 — the vertical axis of the Nakaya diagram.
   */
  function excessDensity(tempC) {
    const T = tempC + 273.15;
    const Rv = 461.5;                       // J kg^-1 K^-1 for water vapour
    return ((pSatWater(T) - pSatIce(T)) / (Rv * T)) * 1000;
  }

  /* ------------------------------------------------------------- regimes -- */

  // Measured from arXiv:1211.5555v1 Fig. 1; read uncertainty +/-0.5 C.
  const BOUNDARIES = [-3.3, -9.9, -21.5];

  const BANDS = [
    { from: 0, to: -3.3, key: "plates", label: "Plates" },
    { from: -3.3, to: -9.9, key: "columns", label: "Columns" },
    { from: -9.9, to: -21.5, key: "plates", label: "Plates" },
    { from: -21.5, to: -35, key: "mixed", label: "Columns and plates" },
  ];

  function bandAt(tempC) {
    for (const b of BANDS) if (tempC <= b.from && tempC > b.to) return b;
    return BANDS[BANDS.length - 1];
  }

  /**
   * Name the crystal you would expect at (T, sigma).
   * Complexity rises with supersaturation: this is the caption's own claim,
   * "higher supersaturations generally produce more complex structures."
   */
  function habitAt(tempC, excess) {
    const band = bandAt(tempC);
    const water = excessDensity(tempC);
    const frac = water > 0 ? excess / water : 0;   // how close to a dense cloud

    if (band.key === "columns") {
      if (frac > 0.75) return { name: "Needles", glyph: "needle" };
      if (frac > 0.4) return { name: "Hollow columns", glyph: "hollow-column" };
      return { name: "Solid columns", glyph: "column" };
    }
    if (band.key === "mixed") {
      if (frac > 0.7) return { name: "Columns and plates together", glyph: "capped" };
      return { name: "Short solid prisms", glyph: "column" };
    }
    // plate bands
    const cold = tempC < -9.9;
    if (frac > 0.8) return { name: cold ? "Stellar dendrites" : "Dendrites", glyph: "dendrite" };
    if (frac > 0.5) return { name: "Sectored plates", glyph: "sectored" };
    if (frac > 0.25) return { name: cold ? "Thin plates" : "Plates", glyph: "plate" };
    return { name: "Simple thick plates", glyph: "thick-plate" };
  }

  /* -------------------------------------------------------- crystal glyphs */

  /** Draw a stylised crystal of the given kind into `g`, centred at (cx, cy). */
  function drawGlyph(g, kind, cx, cy, size, color) {
    const el = (n, a) => {
      const node = document.createElementNS("http://www.w3.org/2000/svg", n);
      for (const k in a) if (a[k] != null) node.setAttribute(k, String(a[k]));
      return node;
    };
    const stroke = { fill: "none", stroke: color, "stroke-width": 1.8,
                     "stroke-linecap": "round", "stroke-linejoin": "round" };

    function hex(r, rot, extra) {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = ((rot || 0) * Math.PI) / 180 + (Math.PI / 3) * i;
        pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
      }
      const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ") + " Z";
      return el("path", Object.assign({ d: d }, stroke, extra || {}));
    }

    function arm(angleDeg, len, branches) {
      const a = (angleDeg * Math.PI) / 180;
      const x2 = cx + len * Math.cos(a), y2 = cy + len * Math.sin(a);
      const grp = el("g");
      grp.appendChild(el("line", Object.assign({ x1: cx, y1: cy, x2: x2, y2: y2 }, stroke)));
      for (let i = 1; i <= (branches || 0); i++) {
        const f = i / ((branches || 0) + 1);
        const bx = cx + len * f * Math.cos(a), by = cy + len * f * Math.sin(a);
        const bl = len * 0.32 * (1 - f * 0.45);
        for (const s of [-1, 1]) {
          const ba = a + s * (Math.PI / 3);
          grp.appendChild(el("line", Object.assign({
            x1: bx, y1: by,
            x2: bx + bl * Math.cos(ba), y2: by + bl * Math.sin(ba),
          }, stroke, { "stroke-width": 1.3 })));
        }
      }
      return grp;
    }

    switch (kind) {
      case "thick-plate":
        g.appendChild(hex(size * 0.5, 0, { fill: color, "fill-opacity": 0.16 }));
        break;
      case "plate":
        g.appendChild(hex(size * 0.72, 0, { fill: color, "fill-opacity": 0.13 }));
        break;
      case "sectored":
        g.appendChild(hex(size * 0.85, 0, { fill: color, "fill-opacity": 0.1 }));
        for (let i = 0; i < 6; i++) g.appendChild(arm(i * 60, size * 0.85, 0));
        break;
      case "dendrite":
        for (let i = 0; i < 6; i++) g.appendChild(arm(i * 60, size, 3));
        g.appendChild(hex(size * 0.16, 0, { fill: color, "fill-opacity": 0.3 }));
        break;
      case "column":
        g.appendChild(el("rect", Object.assign({
          x: cx - size * 0.28, y: cy - size * 0.62,
          width: size * 0.56, height: size * 1.24, rx: 2,
        }, stroke, { fill: color, "fill-opacity": 0.14 })));
        break;
      case "hollow-column":
        g.appendChild(el("rect", Object.assign({
          x: cx - size * 0.3, y: cy - size * 0.68,
          width: size * 0.6, height: size * 1.36, rx: 2,
        }, stroke, { fill: color, "fill-opacity": 0.1 })));
        g.appendChild(el("path", Object.assign({
          d: `M ${cx - size * 0.14} ${cy - size * 0.5} L ${cx - size * 0.14} ${cy + size * 0.5}
              M ${cx + size * 0.14} ${cy - size * 0.5} L ${cx + size * 0.14} ${cy + size * 0.5}`,
        }, stroke, { "stroke-width": 1.2, "stroke-dasharray": "3 3" })));
        break;
      case "needle":
        g.appendChild(el("rect", Object.assign({
          x: cx - size * 0.11, y: cy - size * 0.95,
          width: size * 0.22, height: size * 1.9, rx: 1.5,
        }, stroke, { fill: color, "fill-opacity": 0.14 })));
        break;
      case "capped":
        g.appendChild(el("rect", Object.assign({
          x: cx - size * 0.16, y: cy - size * 0.42,
          width: size * 0.32, height: size * 0.84, rx: 1.5,
        }, stroke, { fill: color, "fill-opacity": 0.12 })));
        g.appendChild(el("line", Object.assign({
          x1: cx - size * 0.62, y1: cy - size * 0.42, x2: cx + size * 0.62, y2: cy - size * 0.42,
        }, stroke, { "stroke-width": 2.6 })));
        g.appendChild(el("line", Object.assign({
          x1: cx - size * 0.62, y1: cy + size * 0.42, x2: cx + size * 0.62, y2: cy + size * 0.42,
        }, stroke, { "stroke-width": 2.6 })));
        break;
      default:
        g.appendChild(hex(size * 0.6, 0, { fill: color, "fill-opacity": 0.14 }));
    }
  }

  /* ---------------------------------------------------------------- mount */

  /**
   * Mount the diagram.
   *
   *   Nakaya.mount(document.getElementById("x"), {
   *     interactive: true,      // draggable probe + habit readout
   *     showBands: true,        // the four labelled habit bands
   *     showWaterLine: true,    // the supercooled-water saturation curve
   *     showGlyphs: true,       // sample crystals drawn on the field
   *   })
   */
  function mount(root, options) {
    const o = Object.assign(
      { interactive: true, showBands: true, showWaterLine: true, showGlyphs: true },
      options || {}
    );

    const body = root.querySelector(".anim__body") || root;
    const controlBar = root.querySelector(".anim__controls");

    const W = 720, H = 460;
    const M = { top: 34, right: 128, bottom: 58, left: 62 };
    const plot = {
      x0: M.left, x1: W - M.right,
      y0: H - M.bottom, y1: M.top,
    };

    // temperature runs 0 (warm, left) to -35 (cold, right)
    const xs = Viz.scaleLinear([0, -35], [plot.x0, plot.x1]);
    const ys = Viz.scaleLinear([0, 0.3], [plot.y0, plot.y1]);

    let probe = { t: -15, s: 0.16 };
    let svg = null;

    function render() {
      if (svg) svg.remove();
      const c = Viz.colors();
      svg = Viz.createSvg(body, W, H, {
        label:
          "The Nakaya morphology diagram: snow crystal shape as a function of temperature " +
          "and how much spare water vapour the air holds.",
        desc:
          "Temperature runs from 0 to minus 35 degrees Celsius left to right. Four bands: " +
          "plates from 0 to minus 3.3, columns from minus 3.3 to minus 9.9, plates from " +
          "minus 9.9 to minus 21.5, and columns and plates below minus 21.5.",
      });

      const bandInk = [c.series[0], c.series[1], c.series[0], c.series[2]];

      /* ---- habit bands ---- */
      if (o.showBands) {
        BANDS.forEach(function (b, i) {
          const xa = xs(b.from), xb = xs(Math.max(b.to, -35));
          svg.appendChild(Viz.svgEl("rect", {
            x: Math.min(xa, xb), y: plot.y1,
            width: Math.abs(xb - xa), height: plot.y0 - plot.y1,
            fill: bandInk[i], "fill-opacity": 0.07,
          }));
          const label = Viz.svgEl("text", {
            class: "series-label",
            x: (xa + xb) / 2, y: plot.y1 - 10,
            "text-anchor": "middle", fill: bandInk[i],
          });
          label.textContent = b.label;
          svg.appendChild(label);
        });

        BOUNDARIES.forEach(function (t) {
          svg.appendChild(Viz.svgEl("line", {
            x1: xs(t), x2: xs(t), y1: plot.y0, y2: plot.y1,
            stroke: c.inkSecondary, "stroke-width": 1.2, "stroke-dasharray": "5 4",
          }));
          const tag = Viz.svgEl("text", {
            class: "tick-text", x: xs(t), y: plot.y0 + 32, "text-anchor": "middle",
            fill: c.inkSecondary,
          });
          tag.textContent = t + "°";
          svg.appendChild(tag);
        });
      }

      /* ---- axes ---- */
      Viz.axisLeft(svg, ys, {
        x: plot.x0, ticks: 4, grid: true, gridTo: plot.x1,
        title: "Extra water vapour in the air (g/m³)",
        format: (v) => v.toFixed(1),
      });
      Viz.axisBottom(svg, xs, {
        y: plot.y0, values: [0, -5, -10, -15, -20, -25, -30, -35],
        title: "Temperature (°C)",
        titleOffset: 46,
      });

      /* ---- water saturation line ---- */
      if (o.showWaterLine) {
        const pts = [];
        for (let t = -0.5; t >= -35; t -= 0.25) pts.push([t, excessDensity(t)]);
        Viz.series(svg, pts, xs, ys, {
          color: c.series[4],
          dashed: true,
          width: 2,
          label: "Inside a cloud",
          labelAt: pts[pts.length - 1],
          labelDx: 8,
          labelDy: 4,
        });
      }

      /* ---- sample crystals on the field ---- */
      if (o.showGlyphs) {
        const samples = [
          [-2, 0.05], [-2, 0.14],
          [-5, 0.06], [-6, 0.19],
          [-12, 0.06], [-15, 0.14], [-15, 0.26],
          [-25, 0.07], [-28, 0.19],
        ];
        for (const [t, s] of samples) {
          const g = Viz.svgEl("g", { opacity: 0.5 });
          const h = habitAt(t, s);
          drawGlyph(g, h.glyph, xs(t), ys(s), 19, c.muted);
          svg.appendChild(g);
        }
      }

      /* ---- the probe ---- */
      if (o.interactive) {
        const px = xs(probe.t), py = ys(probe.s);
        const h = habitAt(probe.t, probe.s);
        const band = bandAt(probe.t);
        const ink = band.key === "columns" ? c.series[1]
                  : band.key === "mixed" ? c.series[2] : c.series[0];

        // crosshair
        svg.appendChild(Viz.svgEl("line", {
          x1: plot.x0, x2: plot.x1, y1: py, y2: py,
          stroke: ink, "stroke-width": 1, "stroke-dasharray": "2 3", opacity: 0.6,
        }));
        svg.appendChild(Viz.svgEl("line", {
          x1: px, x2: px, y1: plot.y0, y2: plot.y1,
          stroke: ink, "stroke-width": 1, "stroke-dasharray": "2 3", opacity: 0.6,
        }));

        svg.appendChild(Viz.svgEl("circle", {
          cx: px, cy: py, r: 7, fill: ink, stroke: c.surface, "stroke-width": 2,
        }));

        // readout panel — the crystal you would get here
        const panelX = plot.x1 + 14, panelY = plot.y1 + 6;
        const panel = Viz.svgEl("g");
        panel.appendChild(Viz.svgEl("rect", {
          x: panelX, y: panelY, width: M.right - 22, height: 168, rx: 8,
          fill: c.sunken, stroke: c.rule, "stroke-width": 1,
        }));
        const glyphG = Viz.svgEl("g");
        drawGlyph(glyphG, h.glyph, panelX + (M.right - 22) / 2, panelY + 52, 34, ink);
        panel.appendChild(glyphG);

        const nameLines = h.name.split(" ");
        let ty = panelY + 106;
        // wrap the habit name to the panel width
        const wrapped = [];
        let line = "";
        for (const w of nameLines) {
          if ((line + " " + w).trim().length > 13) { wrapped.push(line.trim()); line = w; }
          else line += " " + w;
        }
        if (line.trim()) wrapped.push(line.trim());
        for (const w of wrapped) {
          const t = Viz.svgEl("text", {
            class: "series-label", x: panelX + (M.right - 22) / 2, y: ty,
            "text-anchor": "middle", fill: ink,
          });
          t.textContent = w;
          panel.appendChild(t);
          ty += 15;
        }
        const cond = Viz.svgEl("text", {
          class: "tick-text", x: panelX + (M.right - 22) / 2, y: ty + 6,
          "text-anchor": "middle", fill: c.muted,
        });
        cond.textContent = probe.t.toFixed(1) + "°C";
        panel.appendChild(cond);
        svg.appendChild(panel);
      }

      /* ---- pointer interaction ---- */
      if (o.interactive) {
        svg.style.touchAction = "none";
        svg.style.cursor = "crosshair";
        const move = function (event) {
          const rect = svg.getBoundingClientRect();
          const scale = W / rect.width;
          const mx = (event.clientX - rect.left) * scale;
          const my = (event.clientY - rect.top) * scale;
          if (mx < plot.x0 || mx > plot.x1 || my > plot.y0 || my < plot.y1) return;
          probe.t = Math.max(-35, Math.min(0, xs.invert(mx)));
          probe.s = Math.max(0, Math.min(0.3, ys.invert(my)));
          if (tempSlider) tempSlider.input.value = probe.t;
          if (satSlider) satSlider.input.value = probe.s;
          syncOutputs();
          render();
        };
        svg.addEventListener("pointerdown", function (e) {
          svg.setPointerCapture(e.pointerId);
          move(e);
        });
        svg.addEventListener("pointermove", function (e) {
          if (e.buttons) move(e);
        });
      }
    }

    /* ---- sliders, so it is usable without a pointer ---- */
    let tempSlider = null, satSlider = null;
    function syncOutputs() {
      if (tempSlider) {
        tempSlider.input.nextElementSibling.textContent = probe.t.toFixed(1) + " °C";
      }
      if (satSlider) {
        satSlider.input.nextElementSibling.textContent = probe.s.toFixed(2) + " g/m³";
      }
    }

    if (o.interactive && controlBar) {
      tempSlider = Viz.slider(controlBar, {
        label: "Temperature", id: "nakaya-t",
        min: -35, max: 0, step: 0.1, value: probe.t,
        format: (v) => v.toFixed(1) + " °C",
        onInput: function (v) { probe.t = v; render(); },
      });
      satSlider = Viz.slider(controlBar, {
        label: "Vapour", id: "nakaya-s",
        min: 0, max: 0.3, step: 0.005, value: probe.s,
        format: (v) => v.toFixed(2) + " g/m³",
        onInput: function (v) { probe.s = v; render(); },
      });
    }

    render();
    Viz.onThemeChange(render);

    return { render: render, habitAt: habitAt, excessDensity: excessDensity };
  }

  window.Nakaya = {
    mount: mount,
    habitAt: habitAt,
    bandAt: bandAt,
    excessDensity: excessDensity,
    pSatIce: pSatIce,
    pSatWater: pSatWater,
    BOUNDARIES: BOUNDARIES,
    BANDS: BANDS,
  };
})();
