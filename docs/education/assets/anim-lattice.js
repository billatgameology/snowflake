/* ============================================================================
   Why six sides — from water molecules to a hexagonal crystal
   ----------------------------------------------------------------------------
   ORIGINAL animation. It stages the causal chain the site argues in prose:

     a water molecule bonds to its neighbours at a fixed angle
       -> the only way to tile that angle in a plane is a honeycomb of rings
         -> the crystal that grows from it inherits the honeycomb's symmetry
           -> so the outside of the crystal is a hexagon

   The geometry is the basal plane of ice Ih viewed along the c-axis, which is
   a honeycomb of oxygen atoms. That structure is described in Libbrecht,
   "Snow Crystals" (arXiv:1910.06389v2), chapter 2 — the ice crystal structure
   sections. Positions here are drawn from the ideal honeycomb, not from
   crystallographic coordinates: this is a diagram of the symmetry, not a
   structure determination, and no distance on it is a measurement.

   Timeline (seconds):
     0.0-2.5  molecules drift at random
     2.5-5.0  they snap into their honeycomb positions
     5.0-7.0  the lattice extends outward, ring by ring
     7.0-9.0  the crystal's own hexagonal outline is drawn around it
     9.0-11   hold, then repeat
   ========================================================================= */

(function () {
  "use strict";

  // Sized so the outermost site stays clear of the caption line: the furthest
  // site sits about 8.5 * SIDE from the centre.
  const SIDE = 20;                 // honeycomb bond length in px
  const RINGS = 5;                 // how many hex shells of cells to build

  /* ------------------------------------------------------- lattice build -- */

  /** Build the honeycomb: vertices (oxygen sites) and the bonds between them. */
  function buildHoneycomb(cx, cy) {
    const key = (x, y) => Math.round(x * 2) + "," + Math.round(y * 2);
    const sites = new Map();

    // hex cell centres, then each cell's six corners are lattice sites
    for (let q = -RINGS; q <= RINGS; q++) {
      for (let r = -RINGS; r <= RINGS; r++) {
        if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) > RINGS) continue;
        const px = cx + SIDE * Math.sqrt(3) * (q + r / 2);
        const py = cy + SIDE * 1.5 * r;
        for (let i = 0; i < 6; i++) {
          const a = Math.PI / 6 + (Math.PI / 3) * i;
          const x = px + SIDE * Math.cos(a);
          const y = py + SIDE * Math.sin(a);
          const k = key(x, y);
          if (!sites.has(k)) {
            sites.set(k, { x: x, y: y, r: Math.hypot(x - cx, y - cy) });
          }
        }
      }
    }

    const list = [...sites.values()].sort((a, b) => a.r - b.r);

    // bonds join sites one bond-length apart
    const bonds = [];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const d = Math.hypot(list[i].x - list[j].x, list[i].y - list[j].y);
        if (Math.abs(d - SIDE) < SIDE * 0.12) bonds.push([i, j]);
      }
    }
    return { sites: list, bonds: bonds };
  }

  /* --------------------------------------------------------------- mount -- */

  function mount(root, options) {
    const o = Object.assign({ width: 640, height: 430 }, options || {});
    const body = root.querySelector(".anim__body") || root;
    const bar = root.querySelector(".anim__controls");

    const W = o.width, H = o.height;
    const CX = W / 2, CY = H / 2 + 6;

    const lattice = buildHoneycomb(CX, CY);
    const maxR = lattice.sites[lattice.sites.length - 1].r;

    // a fixed scatter start for each site, so the animation is repeatable
    lattice.sites.forEach(function (s, i) {
      const a = (i * 2.399963);                    // golden-angle spread
      const d = 120 + ((i * 37) % 130);
      s.sx = CX + d * Math.cos(a);
      s.sy = CY + d * Math.sin(a) * 0.72;
      s.spin = ((i * 53) % 360);
    });

    const DUR = 11;
    let svg = null;
    let scrub = null;

    const easeInOut = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
    const clamp01 = (u) => Math.max(0, Math.min(1, u));

    function stageOf(t) {
      if (t < 2.5) return "Molecules drifting in the air";
      if (t < 5) return "Each one locks on at the same angle";
      if (t < 7) return "The pattern repeats outward — a honeycomb";
      return "The crystal inherits the honeycomb's six-fold symmetry";
    }

    function render(t) {
      const time = Math.max(0, Math.min(DUR, t));
      if (svg) svg.remove();
      const c = Viz.colors();

      svg = Viz.createSvg(body, W, H, {
        label:
          "Water molecules drifting at random snap into a honeycomb of six-sided rings, the " +
          "pattern spreads outward, and a hexagonal crystal outline appears around it.",
        desc: stageOf(time),
      });

      const settle = clamp01((time - 2.5) / 2.5);        // scatter -> lattice
      const spread = clamp01((time - 5.0) / 2.0);        // how far out the lattice has grown
      const outline = clamp01((time - 7.0) / 1.6);       // the hexagonal facet outline

      const visibleR = time < 5 ? maxR * 0.34 : maxR * (0.34 + 0.66 * easeInOut(spread));

      function posOf(s) {
        const e = easeInOut(settle);
        return [s.sx + (s.x - s.sx) * e, s.sy + (s.y - s.sy) * e];
      }

      const shown = lattice.sites.map(function (s) {
        const on = s.r <= visibleR + 0.5;
        return { s: s, on: on, p: posOf(s) };
      });

      /* ---- bonds appear only once the molecules are in place ---- */
      if (settle > 0.35) {
        const bondAlpha = clamp01((settle - 0.35) / 0.5);
        const g = Viz.svgEl("g", { opacity: bondAlpha * 0.85 });
        for (const [i, j] of lattice.bonds) {
          if (!shown[i].on || !shown[j].on) continue;
          g.appendChild(Viz.svgEl("line", {
            x1: shown[i].p[0], y1: shown[i].p[1],
            x2: shown[j].p[0], y2: shown[j].p[1],
            stroke: c.seq[3], "stroke-width": 2, "stroke-linecap": "round",
          }));
        }
        svg.appendChild(g);
      }

      /* ---- the hexagonal outline the lattice implies.
              Drawn LAST, on top of the molecules, so it reads as one unbroken
              shape rather than a line peeking between atoms. ---- */
      function drawOutline() {
        if (outline <= 0) return;
        const R = visibleR * 0.94;
        const pts = [];
        for (let i = 0; i < 6; i++) {
          const a = Math.PI / 6 + (Math.PI / 3) * i;
          pts.push([CX + R * Math.cos(a), CY + R * Math.sin(a)]);
        }
        const total = 6 * R;   // a regular hexagon's side equals its circumradius
        const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ") + " Z";
        // Second hue, so the crystal's own outline reads as a different thing
        // from the blue molecules and bonds underneath it.
        svg.appendChild(Viz.svgEl("path", {
          d: d, fill: c.series[1], "fill-opacity": 0.05 * outline,
          stroke: c.series[1], "stroke-width": 4.5, "stroke-linejoin": "round",
          "stroke-dasharray": total, "stroke-dashoffset": total * (1 - easeInOut(outline)),
        }));
      }

      /* ---- the molecules ---- */
      for (const item of shown) {
        if (!item.on) continue;
        const [x, y] = item.p;
        const g = Viz.svgEl("g");

        if (settle < 0.9) {
          // still tumbling: show the bent H2O shape so the angle is visible
          const ang = item.s.spin * (1 - easeInOut(settle)) + 90 * easeInOut(settle);
          g.setAttribute("transform", `rotate(${ang.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})`);
          for (const s of [-1, 1]) {
            const a = (s * 52.25 * Math.PI) / 180;   // half of the 104.5 degree bond angle
            g.appendChild(Viz.svgEl("line", {
              x1: x, y1: y,
              x2: x + 11 * Math.sin(a), y2: y - 11 * Math.cos(a),
              stroke: c.muted, "stroke-width": 1.6, "stroke-linecap": "round",
              opacity: 1 - easeInOut(settle),
            }));
            g.appendChild(Viz.svgEl("circle", {
              cx: x + 11 * Math.sin(a), cy: y - 11 * Math.cos(a), r: 3.2,
              fill: c.surface, stroke: c.muted, "stroke-width": 1.4,
              opacity: 1 - easeInOut(settle),
            }));
          }
        }

        g.appendChild(Viz.svgEl("circle", {
          cx: x, cy: y, r: 5.4,
          fill: c.series[0], stroke: c.surface, "stroke-width": 1.6,
        }));
        svg.appendChild(g);
      }

      /* ---- one ring highlighted, so "six-sided ring" is visible, not implied -- */
      if (settle > 0.9 && outline < 0.02) {
        const ring = lattice.sites.slice(0, 200).filter((s) => Math.abs(s.r - SIDE) < SIDE * 0.35);
        if (ring.length >= 6) {
          const d = ring
            .sort((a, b) => Math.atan2(a.y - CY, a.x - CX) - Math.atan2(b.y - CY, b.x - CX))
            .map((p, i) => (i ? "L" : "M") + p.x.toFixed(1) + " " + p.y.toFixed(1))
            .join(" ") + " Z";
          svg.appendChild(Viz.svgEl("path", {
            d: d, fill: "none", stroke: c.series[1], "stroke-width": 3,
            "stroke-linejoin": "round", opacity: 0.9,
          }));
        }
      }

      drawOutline();

      /* ---- caption line inside the frame ---- */
      const cap = Viz.svgEl("text", {
        x: W / 2, y: H - 10, "text-anchor": "middle",
        fill: c.inkSecondary, "font-size": 13, "font-weight": 600,
        "font-family": "var(--font-sans)",
      });
      cap.textContent = stageOf(time);
      svg.appendChild(cap);

      if (scrub && !scrub.dragging) scrub.input.value = time;
    }

    // The scrubber includes both endpoints. Do not wrap DUR back to zero:
    // the final lattice state must remain inspectable and distinct from the
    // initial cloud of molecules.
    const anim = Viz.animate(root, render, {
      duration: DUR, loop: false, staticAt: 8.4, controls: false,
    });

    if (bar) {
      const motionPreference = Viz.reduceMotion;
      const playbackButton = Viz.button(bar, "Pause", function () {
        if (anim.isPlaybackRequested) anim.pause();
        else anim.play();
        syncPlaybackButton();
      });

      function syncPlaybackButton() {
        const reduced = motionPreference.matches;
        playbackButton.disabled = reduced;
        playbackButton.textContent = reduced
          ? "Motion reduced"
          : (anim.isPlaybackRequested ? "Pause" : "Play");
        playbackButton.setAttribute(
          "aria-label",
          reduced
            ? "Animation paused because reduced motion is enabled; use the Step through slider"
            : (anim.isPlaybackRequested ? "Pause animation" : "Play animation"),
        );
        playbackButton.title = reduced
          ? "Use the Step through slider to inspect the animation manually"
          : "";
      }

      scrub = Viz.slider(bar, {
        label: "Step through", id: "lattice-scrub",
        min: 0, max: DUR, step: 0.05, value: 0,
        format: (v) => v.toFixed(1) + "s",
        onInput: function (v) {
          anim.pause();
          anim.seek(v);
          syncPlaybackButton();
        },
      });
      scrub.input.addEventListener("pointerdown", function () { scrub.dragging = true; });
      window.addEventListener("pointerup", function () { if (scrub) scrub.dragging = false; });
      motionPreference.addEventListener("change", syncPlaybackButton);
      syncPlaybackButton();
    }

    Viz.onThemeChange(function () { render(anim.time); });
    return anim;
  }

  window.Lattice = { mount: mount };
})();
