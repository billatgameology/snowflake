/* ============================================================================
   Why SIX — can a loop of oxygens close without bending its bonds?
   ----------------------------------------------------------------------------
   ORIGINAL interactive. It exists because "the lattice is hexagonal" is an
   answer that only moves the question, and because the older version of this
   argument was circular: it started from bonds already 120 degrees apart in
   the basal plane, which is the honeycomb it was meant to explain. This one
   starts from the tetrahedral angle and nothing else, and lets the reader
   check every step.

   WHAT IS EXACT HERE, AND WHAT IS NOT
   -----------------------------------
   Every loop drawn here has all its bonds the SAME length and all its corners
   the SAME angle. The only freedom is the fold. Two exact facts drive it.

   1. A flat loop of n equal bonds has corners of (n-2)*180/n degrees:

          n = 3    60.0          n = 6   120.0
          n = 4    90.0          n = 7   128.6
          n = 5   108.0          n = 8   135.0

      That is plane geometry and nothing more.

   2. Folding a closed loop can only make its corners SHARPER, never wider.
      (Fenchel's theorem: the exterior angles of any closed curve in space add
      to at least one full turn, so n*(180 - corner) >= 360, with equality only
      when the loop is flat.) So the flat value above is the widest corner a
      loop of that many bonds can ever have.

   Together those say: a loop can reach the tetrahedral angle of 109.47 degrees
   only if its FLAT corner already clears it. Three, four and five fall short —
   five by only 1.5 degrees, but short is short. Six is the first size that
   clears it, and it clears it by 10.5 degrees, which it gives back by folding.

   The folded loop drawn here is the "chair": alternate atoms lifted by h/2 and
   the rest dropped by h/2, with all n bonds still equal. Writing u = h / bond
   length and c = cos(360/n degrees), the corner angle is exactly

          corner = arccos( u^2 (1 + c) - c )

   which returns the flat value at u = 0 and falls as the loop folds. Setting
   that equal to arccos(-1/3) gives the fold that lands on tetrahedral exactly:
   u = 1/3 for a six-loop, u = 0.468 for an eight-loop, and no solution at all
   for four or fewer.

   The six-loop this produces is the real one. Take the ice Ih oxygen-oxygen
   separation, about 0.276 nm, as the bond: u = 1/3 then puts the loop's radius
   at 0.260 nm, and the loop projects onto a honeycomb of spacing 0.451 nm —
   the lattice constant a0 = 0.452 nm that Libbrecht gives in "Snow Crystals"
   (arXiv:1910.06389v2), printed p. 52, Eq. 2.1. Nothing drawn here is itself a
   measurement: it is ideal geometry, and the only physical input is the
   near-tetrahedral bonding of ice described on printed p. 49.

   A loop with an odd number of atoms has no up-down-up-down fold at all, so
   the fold control is inactive for those sizes. That costs the argument
   nothing, because folding could only take their corners further from
   tetrahedral, and they are already short.
   ========================================================================= */

(function () {
  "use strict";

  const TET = Math.acos(-1 / 3) * 180 / Math.PI;      // 109.4712... degrees
  const SIZES = [3, 4, 5, 6, 8];
  const DEG = Math.PI / 180;

  /* ------------------------------------------------------------ geometry -- */

  /** Corner angle of a flat regular loop of n equal bonds. */
  function flatAngle(n) { return (n - 2) * 180 / n; }

  /** Corner angle of the folded ("chair") loop; u = fold height / bond length. */
  function chairAngle(n, u) {
    const c = Math.cos(2 * Math.PI / n);
    return Math.acos(Math.max(-1, Math.min(1, u * u * (1 + c) - c))) / DEG;
  }

  /** The fold that lands exactly on the tetrahedral angle, or null if none. */
  function tetFold(n) {
    if (n % 2) return null;                            // odd loops cannot fold
    const c = Math.cos(2 * Math.PI / n);
    const u2 = (c - 1 / 3) / (1 + c);
    if (u2 < 0 || u2 >= 1) return null;
    return Math.sqrt(u2);
  }

  /* The loop is spun in its own plane before it is drawn. Purely cosmetic, and
     chosen for two reasons: no two atoms then share a screen column, so the
     near and far halves of a folded ring stay apart; and at the default
     viewpoint a folded six-loop lands in the textbook "chair" pose, with its
     two opposite seat bonds horizontal. */
  const PHASE = 22 * Math.PI / 180;

  /** Atom positions, in units of one bond length: [x, y, z, ringRadius]. */
  function loopAtoms(n, u) {
    const c = Math.cos(2 * Math.PI / n);
    const R = Math.sqrt(Math.max(1e-6, (1 - u * u) / (2 * (1 - c))));
    const out = [];
    for (let k = 0; k < n; k++) {
      const a = 2 * Math.PI * k / n + PHASE;
      out.push([R * Math.cos(a), R * Math.sin(a), (k % 2 ? -1 : 1) * u / 2, R]);
    }
    return out;
  }

  /** Tilt the viewpoint off the loop's axis, about the screen-horizontal line. */
  function project(p, t) {
    const ct = Math.cos(t), st = Math.sin(t);
    return [p[0], p[1] * ct + p[2] * st, -p[1] * st + p[2] * ct];
  }

  /* A weak perspective, so the near half of a tilted ring is visibly nearer
     than the far half. Cosmetic only; no angle is read off the screen. */
  const FOCUS = 4.4;
  function persp(p) {
    const s = FOCUS / (FOCUS - p[2]);
    return [p[0] * s, p[1] * s, p[2]];
  }

  function wrap(text, max) {
    const words = text.split(" "), lines = [];
    let cur = "";
    words.forEach(function (w) {
      if (cur && cur.length + w.length + 1 > max) { lines.push(cur); cur = w; }
      else { cur = cur ? cur + " " + w : w; }
    });
    if (cur) lines.push(cur);
    return lines;
  }

  /* --------------------------------------------------------------- mount -- */

  /**
   * Mount the loop-closing interactive.
   *   WhySix.mount(document.getElementById("why-six-anim"))
   */
  function mount(root, options) {
    const o = Object.assign({ width: 700, height: 500 }, options || {});
    const body = root.querySelector(".anim__body") || root;
    const bar = root.querySelector(".anim__controls");

    const W = o.width, H = o.height;
    const CX = 196, CY = 196;          // centre of the loop panel
    const PXB = 104;                   // pixels per bond length
    const AX = 545;                    // centre of the protractor panel
    const APEX = 232, RAY = 84;        // protractor apex y, ray length

    const SX0 = 82, SX1 = 618;         // the bottom scale, in x
    const SD0 = 55, SD1 = 140;         // the bottom scale, in degrees
    const SY = 444;

    const TILT_MAX = 80;               // 90 would superimpose the two halves
    let n = 6;
    let u = 0;                         // fold, in units of one bond length
    let tilt = 60;                     // degrees off the loop's axis
    let svg = null;
    let foldSlider = null;
    const sizeButtons = [];

    const scale = function (d) { return SX0 + (d - SD0) / (SD1 - SD0) * (SX1 - SX0); };
    const corner = function () { return n % 2 ? flatAngle(n) : chairAngle(n, u); };

    /* ------------------------------------------------------- the verdict -- */

    function verdict() {
      const th = corner(), flat = flatAngle(n), sol = tetFold(n), off = th - TET;
      if (sol === null) {
        return {
          ok: false,
          /* the shortfall of the loop AS DRAWN, so folding a four-loop visibly
             makes things worse rather than leaving the number alone */
          head: "Short by " + (TET - th).toFixed(1) + "°, and folding cannot help.",
          body: "Folding a closed loop only makes its corners sharper, never wider. So " +
                flat.toFixed(1) + "° is the widest a loop of " + n + " can ever be, and no " +
                "loop of " + n + " closes without strained bonds.",
        };
      }
      if (Math.abs(off) < 0.15) {
        return {
          ok: true,
          head: "Every corner is 109.5°. Nothing is bent.",
          body: n === 6
            ? "Three oxygens ride high and three ride low — and six is the shortest loop " +
              "that can do this."
            : "It closes with unstrained bonds, but it is not the shortest loop that does.",
        };
      }
      if (off > 0) {
        return {
          ok: false,
          head: off.toFixed(1) + "° too wide.",
          body: "The corners are still wider than tetrahedral. Keep folding — buckling the " +
                "loop is what closes them.",
        };
      }
      return {
        ok: false,
        head: (-off).toFixed(1) + "° too sharp.",
        body: "Folded past the tetrahedral angle. Ease the fold back.",
      };
    }

    function viewWord() {
      if (tilt <= 4) return "Seen straight down the loop’s axis — a fold is invisible from here.";
      if (tilt >= TILT_MAX - 6) {
        return u > 0.02 && n % 2 === 0
          ? "Seen almost edge-on — the fold shows as a zigzag."
          : "Seen almost edge-on — this loop is flat, so it collapses to a line.";
      }
      return "Tilted " + tilt + "° off the loop’s axis.";
    }

    /* ---------------------------------------------------------- the draw -- */

    function render() {
      if (svg) svg.remove();
      const c = Viz.colors();
      const v = verdict();
      const th = corner();
      /* what the readouts print. Inside the tolerance the verdict calls
         "exactly tetrahedral", print 109.5 rather than a rounding artefact of
         the slider's finite step. */
      const shown = Math.abs(th - TET) < 0.15 ? TET : th;
      const t = tilt * DEG;

      svg = Viz.createSvg(body, W, H, {
        label:
          "Left: a closed loop of oxygen atoms joined by equal bonds, which the reader can " +
          "resize, fold and tilt. Right: the corner angle that loop forces, drawn against the " +
          "tetrahedral angle of 109.5 degrees. Below: a scale showing where each loop size lands.",
        desc:
          "A loop of " + n + " oxygen atoms" + (u > 0.01 ? ", folded" : ", flat") +
          ", has corners of " + shown.toFixed(1) + " degrees. " + v.head + " " + v.body,
      });

      /* ================= panel 1: the loop ================================ */
      const head1 = Viz.svgEl("text", { x: CX, y: 24, "text-anchor": "middle", class: "axis-title" });
      head1.textContent = "The loop — every bond the same length";
      svg.appendChild(head1);

      const raw = loopAtoms(n, u);
      const P = raw.map(function (p) { return persp(project(p, t)); });
      const F = raw.map(function (p) { return persp(project([p[0], p[1], 0], t)); });
      const sx = function (p) { return CX + p[0] * PXB; };
      const sy = function (p) { return CY - p[1] * PXB; };

      /* the mid-plane the loop folds about, so "high" and "low" have a datum */
      if (u > 0.01) {
        const R = raw[0][3];
        let d = "";
        for (let k = 0; k <= 90; k++) {
          const a = 2 * Math.PI * k / 90;
          const q = persp(project([R * Math.cos(a), R * Math.sin(a), 0], t));
          d += (k ? "L" : "M") + sx(q).toFixed(1) + " " + sy(q).toFixed(1) + " ";
        }
        svg.appendChild(Viz.svgEl("path", {
          d: d.trim() + " Z", fill: "none", stroke: c.rule, "stroke-width": 1.3,
          "stroke-dasharray": "4 4",
        }));
        /* a drop line from each atom to that plane: high and low then read as
           geometry rather than as colour */
        raw.forEach(function (p, k) {
          svg.appendChild(Viz.svgEl("line", {
            x1: sx(P[k]).toFixed(1), y1: sy(P[k]).toFixed(1),
            x2: sx(F[k]).toFixed(1), y2: sy(F[k]).toFixed(1),
            stroke: c.ruleStrong, "stroke-width": 1.2, "stroke-dasharray": "3 3",
          }));
        });
      }

      /* the bonds */
      const bg = Viz.svgEl("g", { stroke: c.seq[3], "stroke-width": 4.4, "stroke-linecap": "round" });
      for (let k = 0; k < n; k++) {
        const a = P[k], b = P[(k + 1) % n];
        bg.appendChild(Viz.svgEl("line", {
          x1: sx(a).toFixed(1), y1: sy(a).toFixed(1),
          x2: sx(b).toFixed(1), y2: sy(b).toFixed(1),
        }));
      }
      svg.appendChild(bg);

      /* the atoms, painted back to front */
      const zs = P.map(function (p) { return p[2]; });
      const zLo = Math.min.apply(null, zs), zHi = Math.max.apply(null, zs);
      const spanZ = Math.max(0.05, zHi - zLo);
      P.map(function (p, k) { return { p: p, k: k }; })
        .sort(function (a, b) { return a.p[2] - b.p[2]; })
        .forEach(function (item) {
          const depth = (item.p[2] - zLo) / spanZ;                 // 0 far, 1 near
          svg.appendChild(Viz.svgEl("circle", {
            cx: sx(item.p).toFixed(1), cy: sy(item.p).toFixed(1),
            r: (9.2 + 2.4 * depth).toFixed(1),
            fill: c.seq[Math.max(2, Math.min(6, 2 + Math.round(depth * 4)))],
            stroke: c.surface, "stroke-width": 1.4,
          }));
        });

      /* Name one high atom and one low atom in words, pushed radially outwards
         so the label never lands on the ring it is labelling. Which two get
         named is chosen from the drawing, not fixed in advance: the highest
         lifted atom on screen and the lowest dropped one. Fixed indices would
         sometimes put "riding low" above "riding high", because at a slant the
         tilt of the whole ring can outweigh the fold. */
      if (u > 0.02 && n % 2 === 0 && tilt >= 12) {
        let hi = 0, lo = 1;
        for (let k = 0; k < n; k++) {
          if (k % 2 === 0) { if (P[k][1] > P[hi][1]) hi = k; }
          else if (P[k][1] < P[lo][1]) lo = k;
        }
        [[hi, "riding high"], [lo, "riding low"]].forEach(function (pair) {
          const p = P[pair[0]];
          const px = sx(p), py = sy(p);
          const dx = px - CX, dy = py - CY, len = Math.max(1, Math.hypot(dx, dy));
          const lab = Viz.svgEl("text", {
            x: (px + dx / len * 26).toFixed(1), y: (py + dy / len * 24 + 4).toFixed(1),
            "text-anchor": dx >= 0 ? "start" : "end",
            class: "annotation", fill: c.inkSecondary,
            stroke: c.surface, "paint-order": "stroke", "stroke-width": 4,
            "stroke-linejoin": "round",
          });
          lab.textContent = pair[1];
          svg.appendChild(lab);
        });
      }

      const view = Viz.svgEl("text", { x: CX, y: 350, "text-anchor": "middle", class: "annotation" });
      view.textContent = viewWord();
      svg.appendChild(view);

      /* ================= panel 2: the corner angle ======================== */
      const head2 = Viz.svgEl("text", { x: AX, y: 24, "text-anchor": "middle", class: "axis-title" });
      head2.textContent = "The corner it forces on every atom";
      svg.appendChild(head2);

      function ray(deg, len) {
        const a = (-90 + deg) * DEG;
        return [AX + len * Math.cos(a), APEX + len * Math.sin(a)];
      }

      /* the tetrahedral corner, dashed, always in the same place */
      [-1, 1].forEach(function (s) {
        const e = ray(s * TET / 2, RAY + 14);
        svg.appendChild(Viz.svgEl("line", {
          x1: AX, y1: APEX, x2: e[0].toFixed(1), y2: e[1].toFixed(1),
          stroke: c.series[1], "stroke-width": 2, "stroke-dasharray": "6 4",
        }));
      });
      const ge = ray(TET / 2, RAY + 22);
      const gl = Viz.svgEl("text", {
        x: (ge[0] + 6).toFixed(1), y: (ge[1] + 4).toFixed(1),
        class: "series-label", fill: c.series[1],
        stroke: c.surface, "paint-order": "stroke", "stroke-width": 4, "stroke-linejoin": "round",
      });
      gl.textContent = "109.5°";
      svg.appendChild(gl);

      /* the corner this loop actually makes */
      [-1, 1].forEach(function (s) {
        const e = ray(s * th / 2, RAY);
        svg.appendChild(Viz.svgEl("line", {
          x1: AX, y1: APEX, x2: e[0].toFixed(1), y2: e[1].toFixed(1),
          stroke: c.seq[3], "stroke-width": 4.6, "stroke-linecap": "round",
        }));
        svg.appendChild(Viz.svgEl("circle", {
          cx: e[0].toFixed(1), cy: e[1].toFixed(1), r: 8.4,
          fill: c.seq[4], stroke: c.surface, "stroke-width": 1.4,
        }));
      });
      svg.appendChild(Viz.svgEl("circle", {
        cx: AX, cy: APEX, r: 9.4, fill: c.seq[6], stroke: c.surface, "stroke-width": 1.4,
      }));

      let arc = "";
      for (let k = 0; k <= 30; k++) {
        const p = ray(-th / 2 + th * (k / 30), 40);
        arc += (k ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1) + " ";
      }
      svg.appendChild(Viz.svgEl("path", {
        d: arc.trim(), fill: "none", stroke: c.ink, "stroke-width": 1.6,
      }));
      const at = Viz.svgEl("text", {
        x: AX, y: APEX - 50, "text-anchor": "middle", class: "series-label", fill: c.ink,
        stroke: c.surface, "paint-order": "stroke", "stroke-width": 4, "stroke-linejoin": "round",
      });
      at.textContent = shown.toFixed(1) + "°";
      svg.appendChild(at);

      /* the readout, in words */
      const sub = Viz.svgEl("text", { x: AX, y: 272, "text-anchor": "middle", class: "annotation" });
      sub.textContent = "loop of " + n + (u > 0.01 ? ", folded" : ", flat") +
                        " — corner " + shown.toFixed(1) + "°";
      svg.appendChild(sub);

      const vh = Viz.svgEl("text", {
        x: AX, y: 298, "text-anchor": "middle", class: "series-label",
        fill: v.ok ? c.good : c.critical,
      });
      vh.textContent = (v.ok ? "✓ " : "✗ ") + v.head;
      svg.appendChild(vh);

      wrap(v.body, 44).slice(0, 4).forEach(function (line, i) {
        const tx = Viz.svgEl("text", {
          x: AX, y: 320 + i * 17, "text-anchor": "middle", class: "annotation",
        });
        tx.textContent = line;
        svg.appendChild(tx);
      });

      /* ================= the scale along the bottom ======================= */
      svg.appendChild(Viz.svgEl("line", {
        x1: 40, y1: 378, x2: 660, y2: 378, stroke: c.rule, "stroke-width": 1,
      }));

      const head3 = Viz.svgEl("text", { x: 350, y: 400, "text-anchor": "middle", class: "axis-title" });
      head3.textContent = "The widest corner each loop size can offer";
      svg.appendChild(head3);

      svg.appendChild(Viz.svgEl("line", {
        x1: SX0, y1: SY, x2: SX1, y2: SY,
        stroke: c.ruleStrong, "stroke-width": 1.6, "stroke-linecap": "round",
      }));

      /* the line the loops are being measured against */
      const tx0 = scale(TET);
      svg.appendChild(Viz.svgEl("line", {
        x1: tx0.toFixed(1), y1: SY - 12, x2: tx0.toFixed(1), y2: SY + 12,
        stroke: c.series[1], "stroke-width": 2.2,
      }));
      const tl = Viz.svgEl("text", {
        x: tx0.toFixed(1), y: SY + 28, "text-anchor": "middle",
        class: "series-label", fill: c.series[1],
      });
      tl.textContent = "tetrahedral 109.5°";
      svg.appendChild(tl);

      /* How far the current fold has slid the current loop. Drawn along the
         axis itself, and BEFORE the dots, so the dots stay on top of it and
         nothing lands on the tetrahedral label below. */
      if (u > 0.01 && n % 2 === 0) {
        const xa = scale(flatAngle(n)), xb = scale(th);
        svg.appendChild(Viz.svgEl("line", {
          x1: xa.toFixed(1), y1: SY, x2: xb.toFixed(1), y2: SY,
          stroke: c.seq[5], "stroke-width": 3.4, "stroke-linecap": "round",
        }));
        svg.appendChild(Viz.svgEl("path", {
          d: "M" + (xb - 1).toFixed(1) + " " + SY +
             " L" + (xb + 8).toFixed(1) + " " + (SY - 5) +
             " L" + (xb + 8).toFixed(1) + " " + (SY + 5) + " Z",
          fill: c.seq[5],
        }));
      }

      /* one dot per loop size, at its flat corner angle */
      SIZES.forEach(function (m) {
        const x = scale(flatAngle(m));
        const here = m === n;
        svg.appendChild(Viz.svgEl("circle", {
          cx: x.toFixed(1), cy: SY, r: here ? 7.5 : 5,
          fill: here ? c.seq[5] : c.seq[2], stroke: c.surface, "stroke-width": 1.5,
        }));
        const lab = Viz.svgEl("text", {
          x: x.toFixed(1), y: SY - 24, "text-anchor": "middle",
          class: here ? "series-label" : "annotation",
          fill: here ? c.ink : c.inkSecondary,
          stroke: c.surface, "paint-order": "stroke", "stroke-width": 4, "stroke-linejoin": "round",
        });
        lab.textContent = String(m);
        svg.appendChild(lab);
      });

      const foot = Viz.svgEl("text", { x: 350, y: SY + 48, "text-anchor": "middle", class: "annotation" });
      foot.textContent = "Folding slides a loop left along this line. It never slides one right.";
      svg.appendChild(foot);
    }

    /* -------------------------------------------------------- the controls */

    function setSize(next) {
      n = next;
      sizeButtons.forEach(function (b) {
        b.el.setAttribute("aria-pressed", String(b.n === n));
      });
      const foldable = n % 2 === 0;
      if (foldSlider) {
        foldSlider.input.disabled = !foldable;
        foldSlider.element.style.opacity = foldable ? "" : "0.45";
        if (!foldable && u !== 0) foldSlider.value = 0;   // also sets u and redraws
      }
      render();
    }

    if (bar) {
      SIZES.forEach(function (m) {
        const el = Viz.button(bar, String(m), function () { setSize(m); }, { pressed: m === n });
        el.setAttribute("aria-label", "a loop of " + m + " oxygen atoms");
        sizeButtons.push({ n: m, el: el });
      });

      /* The step is fine enough that snapping to it lands inside the 0.15-degree
         tolerance the verdict uses to say "exactly tetrahedral". */
      const STEP = 0.002;
      foldSlider = Viz.slider(bar, {
        label: "Fold the loop", id: "why-six-fold",
        min: 0, max: 0.7, step: STEP, value: 0,
        format: function (val) { return val < STEP / 2 ? "flat" : val.toFixed(3) + " × bond"; },
        onInput: function (val) { u = val; render(); },
      });

      const snap = Viz.button(bar, "Fold to 109.5°", function () {
        const sol = tetFold(n);
        foldSlider.value = sol === null ? 0 : Math.round(sol / STEP) * STEP;
      });
      snap.setAttribute("aria-label",
        "fold this loop until its corners reach the tetrahedral angle");

      Viz.slider(bar, {
        label: "Viewpoint", id: "why-six-tilt",
        min: 0, max: TILT_MAX, step: 1, value: tilt,
        format: function (val) { return val + "°"; },
        onInput: function (val) { tilt = val; render(); },
      });
    }

    setSize(n);
    Viz.onThemeChange(render);
    return { render: render };
  }

  window.WhySix = { mount: mount };
})();
