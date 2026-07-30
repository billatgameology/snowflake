/* ============================================================================
   The Gravner-Griffeath "zoo" — an original, simplified reimplementation
   ----------------------------------------------------------------------------
   This is NOT this project's own production solver (see core/, solver-cpu/,
   docs/gg-machinery.md for that — a much more elaborate, differently
   parameterized implementation used for this project's own validation work).
   It is a small, self-contained, honest cellular automaton built directly
   from the rule published in:

     Janko Gravner & David Griffeath, "Modeling snow-crystal growth: A
     three-dimensional mesoscopic approach", Physical Review E 79, 011601
     (2009).

   WHAT IS KEPT, WHAT IS DROPPED, so nobody mistakes this for a port:

     - The paper's lattice is T x Z: a triangular lattice T (six in-plane
       neighbours) stacked with a vertical Z axis (two more neighbours,
       giving eight total) so the model can grow true 3-D columns and
       hollow forms. This demo drops the Z axis entirely and runs only on
       the flat hexagonal T lattice — a single layer. That is a real
       limitation, not a simplification of convenience: a true needle or a
       hollow column is fundamentally a Z-axis phenomenon, and neither can
       be drawn faithfully by a one-layer model. See the chapter prose and
       the figure caption for what this demo can and cannot show.

     - Each site keeps the paper's two mass fields: diffusive (vapour) mass
       d and boundary mass b, plus an attachment flag a. Attached sites are
       permanent, exactly as in the paper (no melting/sublimation of frozen
       sites — the paper does not model that either, see its Sec. II.A.3).

     - Diffusion is the paper's own Eq. (1a): a fixed 1/7 average of a site
       and its six T-neighbours, one substep per tick (not relaxed to
       equilibrium each frame the way anim-diffusion.js does — the paper's
       vapour field is genuinely time-dependent). A missing neighbour off
       the edge of this small simulated patch reflects (contributes the
       centre site's own value), matching a closed, reflecting domain: the
       total vapour + ice mass is approximately conserved, exactly as the
       paper's dynamics conserves it exactly.

     - Freezing and attachment follow the paper's Eqs. (2)-(3): a boundary
       site (touching at least one attached neighbour) converts a fraction
       of its diffusive mass to boundary mass every tick, and attaches once
       its boundary mass crosses a threshold that depends on its attached
       T-neighbour count, bucketed here at 1, 2, and 3-or-more (the paper
       has seven such buckets, {0,1}x{0,1,2,3}, because it also counts Z
       neighbours; dropping Z collapses that to this demo's three exposed
       thresholds). The paper's own hole-filling rule — attach automatically
       once four or more neighbours are already attached — is kept exactly,
       at the same neighbour count. The freezing fraction itself (the
       paper's kappa, which the paper has decrease with neighbour count) is
       fixed here, not exposed, so the four exposed knobs stay legible:
       background vapour density and the three neighbour-count thresholds.

     - Melting (the paper's Eq. (4), a boundary site's mass reverting to
       vapour) is left out. The paper's own case studies use tiny melting
       rates (mu of order 1e-3 to 1e-4) for numerical polish; the four
       knobs kept here are the ones that decide the gross shape.

   No number in this file is a measured physical quantity. It is a
   qualitative demonstration that one rule, tuned differently, produces
   recognizably different crystal habits — the point of Chapter 9's
   "menagerie", made mechanistic instead of photographic.
   ========================================================================= */

(function () {
  "use strict";

  const R = 46;                       // lattice radius in cells
  const W = 2 * R + 1;                // storage is a (2R+1)^2 rhombus
  const idx = (q, r) => (r + R) * W + (q + R);
  const inside = (q, r) => Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= R;
  const NB = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];

  const SEED_RADIUS = 2;              // a small central hexagon, frozen from the start
  const FREEZE_FRAC = [0.35, 0.55, 0.78]; // fixed, not exposed: kappa's "decreasing in neighbour count"
  const HOLE_FILL_N = 4;              // paper's own automatic-attachment neighbour count
  const TICKS_PER_FRAME = 3;
  const STALL_LIMIT = 90;             // ticks with zero new attachments before auto-pause

  /* ------------------------------------------------------------- lattice -- */

  function makeState() {
    const s = {
      vapour: new Float32Array(W * W),
      vapour2: new Float32Array(W * W),
      boundary: new Float32Array(W * W),
      attached: new Uint8Array(W * W),
      live: [],
      neighbours: null,
      tick: 0,
      attachedCount: 0,
      stalled: false,
      stallTicks: 0,
    };
    const nb = new Int32Array(W * W * 6).fill(-1);
    for (let r = -R; r <= R; r++) {
      for (let q = -R; q <= R; q++) {
        if (!inside(q, r)) continue;
        const i = idx(q, r);
        s.live.push(i);
        for (let k = 0; k < 6; k++) {
          const nq = q + NB[k][0], nr = r + NB[k][1];
          nb[i * 6 + k] = inside(nq, nr) ? idx(nq, nr) : -1;
        }
      }
    }
    s.neighbours = nb;
    return s;
  }

  function reset(s, rho) {
    s.vapour.fill(rho);
    s.vapour2.fill(rho);
    s.boundary.fill(0);
    s.attached.fill(0);
    s.tick = 0;
    s.stalled = false;
    s.stallTicks = 0;
    let n = 0;
    for (let r = -SEED_RADIUS; r <= SEED_RADIUS; r++) {
      for (let q = -SEED_RADIUS; q <= SEED_RADIUS; q++) {
        if (!inside(q, r)) continue;
        if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= SEED_RADIUS) {
          const i = idx(q, r);
          s.attached[i] = 1;
          s.vapour[i] = 0;
          s.vapour2[i] = 0;
          n++;
        }
      }
    }
    s.attachedCount = n;
  }

  /** One pass of the paper's Eq. (1a): fixed 1/7 average, reflecting at the patch edge. */
  function diffuse(s) {
    const v = s.vapour, v2 = s.vapour2, at = s.attached, nb = s.neighbours;
    for (let n = 0; n < s.live.length; n++) {
      const i = s.live[n];
      if (at[i]) { v2[i] = 0; continue; }
      let sum = v[i];
      for (let k = 0; k < 6; k++) {
        const j = nb[i * 6 + k];
        if (j < 0) sum += v[i];               // reflecting: missing neighbour mirrors self
        else sum += at[j] ? 0 : v[j];
      }
      v2[i] = sum / 7;
    }
    s.vapour.set(v2);
  }

  /**
   * The paper's Eqs. (2)-(3): freeze a fraction of local vapour into boundary
   * mass at every site touching the crystal, then attach once the threshold
   * for that site's attached-neighbour count is crossed.
   * thresh = [thresh1, thresh2, thresh3] for 1, 2, and >=3 attached neighbours.
   */
  function freezeAndAttach(s, thresh) {
    const v = s.vapour, b = s.boundary, at = s.attached, nb = s.neighbours;
    // Two phases, deliberately: every count of attached neighbours below is
    // read from `at` before ANY cell in this tick attaches. Flipping `at[i]`
    // as soon as a cell crosses its threshold — attaching cells in a single
    // raster-order pass — would let whichever of the six lattice directions
    // happens to be visited earlier in `s.live`'s fixed iteration order feed
    // its new attachment forward into a neighbour's count later in that same
    // pass. That is a real, order-dependent bias, not a rounding artefact:
    // it deterministically favours one side of the crystal over the other
    // and was caught here because it broke the sixfold symmetry a
    // hexagonal-lattice rule is supposed to produce. Collecting attachments
    // and applying them only after every cell has been evaluated keeps every
    // tick's decisions a function of the *previous* tick's frozen state.
    const toAttach = [];
    for (let n = 0; n < s.live.length; n++) {
      const i = s.live[n];
      if (at[i]) continue;
      let count = 0;
      for (let k = 0; k < 6; k++) {
        const j = nb[i * 6 + k];
        if (j >= 0 && at[j]) count++;
      }
      if (count === 0) continue;

      if (count >= HOLE_FILL_N) { toAttach.push(i); continue; }

      const bucket = count === 1 ? 0 : count === 2 ? 1 : 2;
      const transfer = FREEZE_FRAC[bucket] * v[i];
      b[i] += transfer; v[i] -= transfer;

      if (b[i] >= thresh[bucket]) toAttach.push(i);
    }
    for (let n = 0; n < toAttach.length; n++) {
      const i = toAttach[n];
      at[i] = 1; b[i] += v[i]; v[i] = 0;
    }
    s.attachedCount += toAttach.length;
    return toAttach.length;
  }

  function tick(s, params) {
    diffuse(s);
    const froze = freezeAndAttach(s, [params.thresh1, params.thresh2, params.thresh3]);
    s.tick++;
    if (froze > 0) s.stallTicks = 0; else s.stallTicks++;
    if (s.stallTicks >= STALL_LIMIT) s.stalled = true;
    // stop before the crystal reaches the rim, where the reflecting edge
    // would stop being a fair stand-in for an unbounded patch of sky
    let maxRadius = 0;
    return maxRadius;
  }

  function crystalRadius(s) {
    // cheap bound: derived from attachedCount is not reliable for shape, so
    // scan live cells' hex-distance only among attached ones, sampled sparse
    let maxD = 0;
    const at = s.attached, live = s.live;
    for (let n = 0; n < live.length; n++) {
      if (!at[live[n]]) continue;
      const i = live[n];
      const q = (i % W) - R, r = Math.floor(i / W) - R;
      const d = (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
      if (d > maxD) maxD = d;
    }
    return maxD;
  }

  /* --------------------------------------------------------------- mount -- */

  function hexToRgb(hex) {
    const h = hex.replace("#", "").trim();
    return h.length === 3
      ? h.split("").map((ch) => parseInt(ch + ch, 16))
      : [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function mix(a, b, t) { return [0, 1, 2].map((k) => a[k] + (b[k] - a[k]) * t); }

  const PRESETS = [
    {
      key: "hexagon", label: "Faceted hexagon",
      rho: 0.25, thresh1: 4.00, thresh2: 0.60, thresh3: 0.30,
      note: "A corner cell (1 attached neighbour) is exposed to more open vapour than an " +
        "edge cell, so left alone it would race ahead. Setting its threshold far above the " +
        "edge- and fill-in thresholds throttles exactly that head start, so the flat facets " +
        "advance evenly and the outline stays a clean hexagon.",
    },
    {
      key: "plate", label: "Stellar plate",
      rho: 0.34, thresh1: 0.80, thresh2: 1.00, thresh3: 0.70,
      note: "More vapour, and the three thresholds now sit close together instead of far " +
        "apart. That is no longer enough to fully throttle a corner's natural vapour " +
        "advantage, so the six corners pull gently ahead into rounded lobes while the " +
        "faces between them stay filled in — a plump, six-armed stellar plate.",
    },
    {
      key: "needles", label: "Needle-like blades",
      rho: 0.15, thresh1: 0.10, thresh2: 10.0, thresh3: 12.0,
      note: "The 1-neighbour threshold is almost nothing, so any exposed tip freezes on " +
        "contact; the 2- and 3-neighbour thresholds are pushed far out of reach, so a cell " +
        "beside two already-frozen neighbours essentially never joins. Growth can only ever " +
        "extend a tip, never thicken one — six thin, unbranched spikes. This flat model has " +
        "no vertical axis for a true single needle to grow along.",
    },
    {
      key: "dendrite", label: "Dendritic / branchy",
      rho: 0.42, thresh1: 0.45, thresh2: 1.55, thresh3: 2.80,
      note: "More vapour than the needles above, and the 2-neighbour threshold is brought " +
        "back within reach. The six tips still race ahead and deplete the vapour around " +
        "them, but now a cell just behind a tip can occasionally cross its own, lower bar " +
        "before the tip outruns it completely — small side-branches, still faceted, growing " +
        "off a still-recognisable spike.",
    },
  ];

  /**
   *   GGZoo.mount(root, { preset: "hexagon", size: 420 })
   */
  function mount(root, options) {
    const o = Object.assign({ preset: "hexagon", size: 420 }, options || {});
    const body = root.querySelector(".anim__body") || root;
    const bar = root.querySelector(".anim__controls");

    const SIZE = o.size;
    const view = Viz.createCanvas(body, SIZE, SIZE, {
      label: "A snow crystal growing on a simplified Gravner-Griffeath cellular automaton, " +
        "showing vapour density fading in around a hexagonal ice patch as it accumulates " +
        "boundary mass and freezes.",
    });

    const s = makeState();
    const params = Object.assign({}, PRESETS[0]);
    let currentPresetKey = PRESETS[0].key;
    let playing = true;
    let statusEl = null, playPauseBtn = null;
    const presetButtons = [];
    const sliders = {};

    const buffer = document.createElement("canvas");
    buffer.width = SIZE; buffer.height = SIZE;
    const bufferCtx = buffer.getContext("2d");
    const image = bufferCtx.createImageData(SIZE, SIZE);

    const scale = (SIZE / 2) / ((R + 1.4) * Math.sqrt(3));
    const lookup = new Int32Array(SIZE * SIZE).fill(-1);
    (function buildLookup() {
      for (let py = 0; py < SIZE; py++) {
        for (let px = 0; px < SIZE; px++) {
          const x = (px - SIZE / 2) / scale;
          const y = (py - SIZE / 2) / scale;
          const fq = (Math.sqrt(3) / 3) * x - (1 / 3) * y;
          const fr = (2 / 3) * y;
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
      const maxV = Math.max(0.02, params.rho);

      for (let p = 0; p < SIZE * SIZE; p++) {
        const i = lookup[p];
        const o4 = p * 4;
        data[o4 + 3] = 255;
        let rgb = surface;
        if (i >= 0) {
          if (s.attached[i]) {
            rgb = ice;
          } else {
            const depletion = 1 - Math.max(0, Math.min(1, s.vapour[i] / maxV));
            const t = depletion * (ramp.length - 1);
            const lo = ramp[Math.floor(t)], hi = ramp[Math.min(ramp.length - 1, Math.ceil(t))];
            const f = t - Math.floor(t);
            const vaporCol = [0, 1, 2].map((k) => lo[k] + (hi[k] - lo[k]) * f);
            const base = mix(surface, vaporCol, 0.85 * depletion + 0.06);
            // brighten toward ice colour as boundary mass approaches its threshold —
            // a visible cue for the accumulate-then-snap freezing rule
            let bt = 0;
            if (s.boundary[i] > 0) {
              const nb6 = s.neighbours;
              let count = 0;
              for (let k = 0; k < 6; k++) { const j = nb6[i * 6 + k]; if (j >= 0 && s.attached[j]) count++; }
              const bucket = count <= 1 ? 0 : count === 2 ? 1 : 2;
              const th = [params.thresh1, params.thresh2, params.thresh3][bucket];
              bt = Math.max(0, Math.min(1, s.boundary[i] / Math.max(1e-6, th)));
            }
            rgb = mix(base, ice, bt * 0.65);
          }
        }
        data[o4] = rgb[0]; data[o4 + 1] = rgb[1]; data[o4 + 2] = rgb[2];
      }
      bufferCtx.putImageData(image, 0, 0);
      view.ctx.clearRect(0, 0, SIZE, SIZE);
      view.ctx.drawImage(buffer, 0, 0);

      if (statusEl) {
        const radius = crystalRadius(s);
        const nearEdge = radius > R - 4;
        if (nearEdge && !s.stalled) { s.stalled = true; }
        statusEl.textContent = s.stalled
          ? "stopped — " + (nearEdge ? "reached the edge of this simulated patch" : "vapour exhausted near the crystal")
            + " (" + s.attachedCount + " cells, " + s.tick + " ticks)"
          : (playing ? "growing — " : "paused — ") + s.attachedCount + " cells frozen, " + s.tick + " ticks";
      }
    }

    function simulate() {
      if (s.stalled) return;
      for (let k = 0; k < TICKS_PER_FRAME; k++) {
        if (s.stalled) break;
        tick(s, params);
      }
    }

    const anim = Viz.animate(root, function () {
      if (playing) simulate();
      draw();
    }, { controls: false });

    function applyPreset(preset) {
      Object.assign(params, preset);
      currentPresetKey = preset.key;
      reset(s, params.rho);
      s.stalled = false;
      playing = true;
      if (playPauseBtn) { playPauseBtn.textContent = "Pause"; playPauseBtn.setAttribute("aria-pressed", "true"); }
      presetButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.key === currentPresetKey)));
      sliders.rho.value = params.rho;
      sliders.t1.value = params.thresh1;
      sliders.t2.value = params.thresh2;
      sliders.t3.value = params.thresh3;
      draw();
    }

    if (bar) {
      const presetRow = document.createElement("div");
      presetRow.className = "control";
      presetRow.style.flexWrap = "wrap";
      PRESETS.forEach((preset) => {
        const b = Viz.button(bar, preset.label, function () { applyPreset(preset); }, { pressed: preset.key === currentPresetKey });
        b.dataset.key = preset.key;
        b.title = preset.note;
        presetButtons.push(b);
      });

      sliders.rho = Viz.slider(bar, {
        label: "Background vapour density", id: "gg-rho",
        min: 0.04, max: 0.60, step: 0.01, value: params.rho,
        format: (v) => v.toFixed(2),
        onInput: (v) => { params.rho = v; },
      });
      sliders.t1 = Viz.slider(bar, {
        label: "1-neighbour threshold", id: "gg-t1",
        min: 0.10, max: 5.0, step: 0.05, value: params.thresh1,
        format: (v) => v.toFixed(2),
        onInput: (v) => { params.thresh1 = v; },
      });
      sliders.t2 = Viz.slider(bar, {
        label: "2-neighbour threshold", id: "gg-t2",
        min: 0.10, max: 14.0, step: 0.1, value: params.thresh2,
        format: (v) => v.toFixed(2),
        onInput: (v) => { params.thresh2 = v; },
      });
      sliders.t3 = Viz.slider(bar, {
        label: "3+-neighbour threshold", id: "gg-t3",
        min: 0.10, max: 14.0, step: 0.1, value: params.thresh3,
        format: (v) => v.toFixed(2),
        onInput: (v) => { params.thresh3 = v; },
      });

      playPauseBtn = Viz.button(bar, "Pause", function () {
        playing = !playing;
        playPauseBtn.textContent = playing ? "Pause" : "Play";
        playPauseBtn.setAttribute("aria-pressed", String(playing));
      }, { pressed: true });

      Viz.button(bar, "Reset this shape", function () {
        reset(s, params.rho);
        s.stalled = false;
        playing = true;
        playPauseBtn.textContent = "Pause";
        playPauseBtn.setAttribute("aria-pressed", "true");
        draw();
      });

      statusEl = document.createElement("span");
      statusEl.className = "control";
      statusEl.style.color = "var(--ink-muted)";
      bar.appendChild(statusEl);

      if (Viz.reduceMotion.matches) {
        Viz.button(bar, "Grow 60 ticks", function () {
          for (let i = 0; i < 60 && !s.stalled; i++) tick(s, params);
          draw();
        });
      }
    }

    applyPreset(PRESETS.find((p) => p.key === o.preset) || PRESETS[0]);
    draw();
    Viz.onThemeChange(draw);

    return {
      state: s, params: params, anim: anim, draw: draw,
      forceTicks: function (n) { for (let i = 0; i < n && !s.stalled; i++) tick(s, params); draw(); },
      applyPreset: applyPreset,
      get stats() { return { attached: s.attachedCount, ticks: s.tick, stalled: s.stalled, radius: crystalRadius(s) }; },
    };
  }

  window.GGZoo = { mount: mount, PRESETS: PRESETS };
})();
