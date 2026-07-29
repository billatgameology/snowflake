/* ============================================================================
   Why branches happen — the diffusion instability, simulated live
   ----------------------------------------------------------------------------
   This is an ORIGINAL animation. It is not a scan and not a reproduction of
   anyone's figure; it is a small, honest simulation of the physical statement
   this site makes in prose:

     A growing crystal eats the water vapour around it, leaving a depleted
     zone. Any point that sticks out reaches further into undepleted air, so
     it collects more vapour and grows faster still. That positive feedback
     is what turns a smooth crystal into a branched one.

   That is Libbrecht's account in "Snow Crystals" (arXiv:1910.06389v2),
   chapter 3, and it is the classic Mullins-Sekerka instability.

   HOW IT WORKS, so nobody mistakes it for a research model:
     - the lattice is HEXAGONAL, because ice is; six-fold branching here comes
       from the lattice, exactly as it does in a real crystal
     - vapour density lives on that lattice, pinned to 1 far away and 0 on the
       crystal surface (a perfectly absorbing surface)
     - it is relaxed toward its steady state every frame, which is the
       quasi-static approximation: vapour redistributes far faster than the
       crystal grows
     - a surface cell fills at a rate proportional to the vapour arriving at
       it, and freezes when full
     - "face-seeking" mixes in a term preferring cells with more solid
       neighbours — a cartoon of attachment kinetics that stands in for
       faceting. It is NOT the measured attachment coefficient.

   Growth is normalised so the fastest-growing point advances at a fixed pace.
   That changes only how fast the clock runs, never which points win, so the
   instability being demonstrated is untouched.

   No number in this file is a physical measurement. The claim it supports is
   qualitative, and that is all it is used for.
   ========================================================================= */

(function () {
  "use strict";

  const R = 58;                      // lattice radius in cells
  const W = 2 * R + 1;               // storage is a (2R+1)^2 rhombus
  const idx = (q, r) => (r + R) * W + (q + R);
  const inside = (q, r) => Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= R;

  // the six neighbours of a hexagonal cell, in axial coordinates
  const NB = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];

  /* ------------------------------------------------------------- lattice -- */

  function makeState() {
    const s = {
      vapour: new Float32Array(W * W),
      solid: new Uint8Array(W * W),
      fill: new Float32Array(W * W),
      live: [],          // indices of cells inside the hexagonal domain
      edge: new Uint8Array(W * W),   // 1 if on the far-field rim
      neighbours: null,
      radius: 0,
    };

    const nb = new Int32Array(W * W * 6).fill(-1);
    for (let r = -R; r <= R; r++) {
      for (let q = -R; q <= R; q++) {
        if (!inside(q, r)) continue;
        const i = idx(q, r);
        s.live.push(i);
        if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) === R) s.edge[i] = 1;
        for (let k = 0; k < 6; k++) {
          const nq = q + NB[k][0], nr = r + NB[k][1];
          nb[i * 6 + k] = inside(nq, nr) ? idx(nq, nr) : -1;
        }
      }
    }
    s.neighbours = nb;
    return s;
  }

  function reset(s, seed) {
    s.vapour.fill(0);
    s.solid.fill(0);
    s.fill.fill(0);
    for (const i of s.live) s.vapour[i] = 1;
    const seedR = seed == null ? 1 : seed;
    for (let r = -seedR; r <= seedR; r++) {
      for (let q = -seedR; q <= seedR; q++) {
        if (!inside(q, r)) continue;
        if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= seedR) {
          const i = idx(q, r);
          s.solid[i] = 1;
          s.vapour[i] = 0;
        }
      }
    }
    s.radius = seedR;
  }

  /** One Gauss-Seidel sweep of Laplace's equation over the hexagonal lattice. */
  function relax(s) {
    const v = s.vapour, solid = s.solid, nb = s.neighbours, edge = s.edge;
    for (let n = 0; n < s.live.length; n++) {
      const i = s.live[n];
      if (solid[i]) { v[i] = 0; continue; }
      if (edge[i]) { v[i] = 1; continue; }          // far field stays undepleted
      let sum = 0, count = 0;
      for (let k = 0; k < 6; k++) {
        const j = nb[i * 6 + k];
        if (j < 0) { sum += 1; count++; }           // treat outside as far field
        else { sum += v[j]; count++; }
      }
      v[i] = sum / count;
    }
  }

  /**
   * Advance the crystal. `stick` in [0,1] biases growth toward cells with more
   * solid neighbours (flatter surface), standing in for attachment kinetics.
   * Returns the number of cells that froze.
   */
  function grow(s, pace, stick) {
    const v = s.vapour, solid = s.solid, fill = s.fill, nb = s.neighbours;

    // pass 1 — collect the surface and its arriving vapour
    const surf = [];
    let maxRate = 0;
    for (let n = 0; n < s.live.length; n++) {
      const i = s.live[n];
      if (solid[i]) continue;

      let contact = 0, sum = 0;
      for (let k = 0; k < 6; k++) {
        const j = nb[i * 6 + k];
        if (j < 0) { sum += 1; continue; }
        if (solid[j]) contact++;
        else sum += v[j];
      }
      if (!contact) continue;

      const flux = sum / 6;
      const flatness = contact / 6;
      const rate = flux * ((1 - stick) + stick * flatness);
      surf.push(i, rate);
      if (rate > maxRate) maxRate = rate;
    }
    if (maxRate <= 0) return 0;

    // pass 2 — normalise so the fastest point advances at `pace` per step
    let froze = 0;
    for (let p = 0; p < surf.length; p += 2) {
      const i = surf[p];
      fill[i] += pace * (surf[p + 1] / maxRate);
      if (fill[i] >= 1) {
        solid[i] = 1;
        v[i] = 0;
        froze++;
        const q = (i % W) - R, r = ((i - (i % W)) / W) - R;
        const d = (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
        if (d > s.radius) s.radius = d;
      }
    }
    return froze;
  }

  /* --------------------------------------------------------------- mount -- */

  function hexToRgb(hex) {
    const h = hex.replace("#", "").trim();
    return h.length === 3
      ? h.split("").map((ch) => parseInt(ch + ch, 16))
      : [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  /**
   *   Diffusion.mount(root, { stick: 0.5, showField: true, size: 420 })
   */
  function mount(root, options) {
    const o = Object.assign(
      { stick: 0.5, showField: true, size: 420, pace: 0.34, sweeps: 4 },
      options || {}
    );

    const body = root.querySelector(".anim__body") || root;
    const bar = root.querySelector(".anim__controls");

    const SIZE = o.size;
    const view = Viz.createCanvas(body, SIZE, SIZE, {
      label:
        "A crystal growing on a hexagonal lattice inside a field of water vapour. The air " +
        "around the crystal darkens as the crystal consumes vapour, and the six corners grow " +
        "fastest, turning a compact seed into a six-armed branched shape.",
    });

    const s = makeState();
    reset(s);

    let stick = o.stick;
    let showField = o.showField;

    /* ---- pixel -> cell lookup, computed once ---- */
    const buffer = document.createElement("canvas");
    buffer.width = SIZE;
    buffer.height = SIZE;
    const bufferCtx = buffer.getContext("2d");
    const image = bufferCtx.createImageData(SIZE, SIZE);

    const cellSize = SIZE / (2 * (R + 1) * Math.sqrt(3) / 2) / 2 * 1.0;
    const scale = (SIZE / 2) / ((R + 0.75) * Math.sqrt(3));
    const lookup = new Int32Array(SIZE * SIZE).fill(-1);

    (function buildLookup() {
      for (let py = 0; py < SIZE; py++) {
        for (let px = 0; px < SIZE; px++) {
          const x = (px - SIZE / 2) / scale;
          const y = (py - SIZE / 2) / scale;
          // pixel -> fractional axial (pointy-top)
          const fq = (Math.sqrt(3) / 3) * x - (1 / 3) * y;
          const fr = (2 / 3) * y;
          // cube rounding
          let cx = fq, cz = fr, cy = -cx - cz;
          let rx = Math.round(cx), ry = Math.round(cy), rz = Math.round(cz);
          const dx = Math.abs(rx - cx), dy = Math.abs(ry - cy), dz = Math.abs(rz - cz);
          if (dx > dy && dx > dz) rx = -ry - rz;
          else if (dy > dz) ry = -rx - rz;
          else rz = -rx - ry;
          if (inside(rx, rz)) lookup[py * SIZE + px] = idx(rx, rz);
        }
      }
    })();

    function draw() {
      const c = Viz.colors();
      const ramp = c.seq.map(hexToRgb);
      const surface = hexToRgb(c.surface);
      const ice = hexToRgb(c.series[0]);
      const data = image.data;

      for (let p = 0; p < SIZE * SIZE; p++) {
        const i = lookup[p];
        const o4 = p * 4;
        data[o4 + 3] = 255;
        if (i < 0) {
          data[o4] = surface[0]; data[o4 + 1] = surface[1]; data[o4 + 2] = surface[2];
          continue;
        }
        if (s.solid[i]) {
          data[o4] = ice[0]; data[o4 + 1] = ice[1]; data[o4 + 2] = ice[2];
        } else if (showField) {
          const depletion = 1 - Math.max(0, Math.min(1, s.vapour[i]));
          const t = depletion * (ramp.length - 1);
          const lo = ramp[Math.floor(t)];
          const hi = ramp[Math.min(ramp.length - 1, Math.ceil(t))];
          const f = t - Math.floor(t);
          const a = 0.8 * depletion;
          for (let k = 0; k < 3; k++) {
            const mix = lo[k] + (hi[k] - lo[k]) * f;
            data[o4 + k] = surface[k] + (mix - surface[k]) * a;
          }
        } else {
          data[o4] = surface[0]; data[o4 + 1] = surface[1]; data[o4 + 2] = surface[2];
        }
      }

      bufferCtx.putImageData(image, 0, 0);
      view.ctx.clearRect(0, 0, SIZE, SIZE);
      view.ctx.drawImage(buffer, 0, 0);
    }

    function step() {
      for (let k = 0; k < o.sweeps; k++) relax(s);
      grow(s, o.pace, stick);
      // stop before the crystal reaches the rim, where the fixed far-field
      // condition would stop being a fair stand-in for open air
      if (s.radius > R - 6) { reset(s); for (let k = 0; k < 40; k++) relax(s); }
      draw();
    }

    // settle the vapour field before the first frame
    for (let k = 0; k < 60; k++) relax(s);

    const anim = Viz.animate(root, function () { step(); }, { controls: false });

    if (bar) {
      Viz.slider(bar, {
        label: "Face-seeking", id: "diff-stick",
        min: 0, max: 1, step: 0.01, value: stick,
        format: (v) => (v < 0.3 ? "low — branchy" : v < 0.7 ? "medium" : "high — blocky"),
        onInput: function (v) { stick = v; },
      });
      Viz.button(bar, showField ? "Hide the vapour" : "Show the vapour", function (b) {
        showField = !showField;
        b.textContent = showField ? "Hide the vapour" : "Show the vapour";
        b.setAttribute("aria-pressed", String(showField));
        draw();
      }, { pressed: showField });
      Viz.button(bar, "Start again", function () {
        reset(s);
        for (let k = 0; k < 60; k++) relax(s);
        draw();
      });
      if (Viz.reduceMotion.matches) {
        Viz.button(bar, "Grow 60 steps", function () { for (let i = 0; i < 60; i++) step(); });
      }
    }

    draw();
    Viz.onThemeChange(draw);
    return { step: step, draw: draw, state: s, anim: anim };
  }

  window.Diffusion = { mount: mount };
})();
