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
       centre site's own value), matching a closed, reflecting domain. The
       total diffusive + boundary mass is conserved up to floating-point
       roundoff; a live sum below the picture makes that contract testable.

     - Freezing and attachment follow the paper's Eqs. (2)-(3): a boundary
       site (touching at least one attached neighbour) converts a fraction
       of its diffusive mass to boundary mass every tick, and attaches once
       its boundary mass crosses a threshold that depends on its attached
       T-neighbour count, bucketed here at 1, 2, and 3-or-more (the paper
       has seven such buckets, {0,1}x{0,1,2,3}, because it also counts Z
       neighbours; dropping Z collapses that to this demo's three exposed
       thresholds). The paper's own hole-filling rule — attach automatically
       once four or more neighbours are already attached — is kept exactly,
       at the same neighbour count. The fraction frozen is 1 minus the
       paper's kappa; kappa decreases, so this frozen fraction increases
       with neighbour count. It is fixed here, not exposed, so the four
       exposed knobs stay legible:
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
  // This is 1 - kappa, the fraction transferred out of vapour. The paper
  // requires kappa to decrease with neighbour count, so 1 - kappa increases.
  const ONE_MINUS_KAPPA = [0.35, 0.55, 0.78];
  const HOLE_FILL_N = 4;              // paper's own automatic-attachment neighbour count
  const TICKS_PER_FRAME = 3;
  const EDGE_GUARD_RADIUS = R - 4;     // retain a four-cell buffer around the crystal
  const MAX_TICKS = 12000;             // explicit work guard; never called "vapour exhausted"

  /* ------------------------------------------------------------- lattice -- */

  function makeState() {
    const s = {
      vapour: new Float64Array(W * W),
      vapour2: new Float64Array(W * W),
      boundary: new Float64Array(W * W),
      attached: new Uint8Array(W * W),
      live: [],
      neighbours: null,
      tick: 0,
      attachedCount: 0,
      stopped: false,
      stopReason: "",
      maxRadius: SEED_RADIUS,
      initialMass: 0,
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
    s.stopped = false;
    s.stopReason = "";
    s.maxRadius = SEED_RADIUS;
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
    s.initialMass = diagnostics(s).mass;
  }

  /** One pass of the paper's Eq. (1a): fixed 1/7 average, reflecting at the patch edge. */
  function diffuse(s) {
    const v = s.vapour, v2 = s.vapour2, at = s.attached, nb = s.neighbours;
    const operands = new Float64Array(7);
    for (let n = 0; n < s.live.length; n++) {
      const i = s.live[n];
      if (at[i]) { v2[i] = 0; continue; }
      operands[0] = v[i];
      for (let k = 0; k < 6; k++) {
        const j = nb[i * 6 + k];
        operands[k + 1] = j < 0 || at[j] ? v[i] : v[j];
      }
      // A D6 transform permutes these seven operands. Sorting makes the
      // evaluated reduction depend on their multiset rather than direction
      // enumeration, so an exactly symmetric field remains exactly symmetric.
      operands.sort();
      let sum = 0;
      for (let k = 0; k < operands.length; k++) sum += operands[k];
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
      const transfer = ONE_MINUS_KAPPA[bucket] * v[i];
      b[i] += transfer; v[i] -= transfer;

      if (b[i] >= thresh[bucket]) toAttach.push(i);
    }
    for (let n = 0; n < toAttach.length; n++) {
      const i = toAttach[n];
      at[i] = 1; b[i] += v[i]; v[i] = 0;
      const q = (i % W) - R, r = Math.floor(i / W) - R;
      const d = (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
      if (d > s.maxRadius) s.maxRadius = d;
    }
    s.attachedCount += toAttach.length;
    return toAttach.length;
  }

  function tick(s, params) {
    if (s.stopped) return;
    diffuse(s);
    freezeAndAttach(s, [params.thresh1, params.thresh2, params.thresh3]);
    s.tick++;
    if (s.maxRadius >= EDGE_GUARD_RADIUS) {
      s.stopped = true;
      s.stopReason = "reached the " + (R - EDGE_GUARD_RADIUS) + "-cell edge guard";
    } else if (s.tick >= MAX_TICKS) {
      s.stopped = true;
      s.stopReason = "reached the explicit " + MAX_TICKS.toLocaleString() + "-tick work guard";
    }
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

  /**
   * Recompute diagnostics from the published state arrays. These values do
   * not trust tick counters or a separately accumulated ledger.
   */
  function diagnostics(s) {
    let mass = 0;
    let correction = 0;
    let maxBoundary = 0;
    const v = s.vapour, b = s.boundary, at = s.attached, nb = s.neighbours;
    for (let n = 0; n < s.live.length; n++) {
      const i = s.live[n];
      // Kahan summation keeps the display sensitive to solver loss rather
      // than to the order in which the diagnostic scans the lattice.
      const term = v[i] + b[i];
      const y = term - correction;
      const t = mass + y;
      correction = (t - mass) - y;
      mass = t;
      if (at[i] || b[i] <= maxBoundary) continue;
      let isBoundary = false;
      for (let k = 0; k < 6; k++) {
        const j = nb[i * 6 + k];
        if (j >= 0 && at[j]) { isBoundary = true; break; }
      }
      if (isBoundary) maxBoundary = b[i];
    }
    return { mass: mass, maxBoundary: maxBoundary };
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
    const manualMotion = Viz.reduceMotion.matches;
    let playing = !manualMotion;
    let statusEl = null, diagnosticsEl = null, playPauseBtn = null;
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
        statusEl.textContent = s.stopped
          ? "stopped — " + s.stopReason + " (" + s.attachedCount + " cells, " + s.tick + " ticks)"
          : (manualMotion ? "manual stepping — " : playing ? "growing — " : "paused — ")
            + s.attachedCount + " cells frozen, " + s.tick + " ticks";
      }
      if (s.stopped && playPauseBtn) {
        playing = false;
        playPauseBtn.disabled = true;
        playPauseBtn.textContent = "Stopped";
        playPauseBtn.setAttribute("aria-pressed", "false");
      }
      if (diagnosticsEl) {
        const d = diagnostics(s);
        const drift = d.mass - s.initialMass;
        diagnosticsEl.textContent = "recomputed Σ(d+b) " + d.mass.toFixed(9)
          + " (Δ " + (drift >= 0 ? "+" : "") + drift.toExponential(2) + ")"
          + " · max active b " + d.maxBoundary.toFixed(6)
          + " · radius " + s.maxRadius + "/" + EDGE_GUARD_RADIUS;
      }
    }

    function simulate() {
      if (s.stopped) return;
      for (let k = 0; k < TICKS_PER_FRAME; k++) {
        if (s.stopped) break;
        tick(s, params);
      }
    }

    const anim = Viz.animate(root, function () {
      if (playing) simulate();
      draw();
    }, { controls: false });

    function applyPreset(preset) {
      Object.assign(params, preset);
      reset(s, params.rho);
      playing = !manualMotion;
      if (playPauseBtn) {
        playPauseBtn.disabled = false;
        playPauseBtn.textContent = "Pause";
        playPauseBtn.setAttribute("aria-pressed", "true");
      }
      if (sliders.rho) sliders.rho.value = params.rho;
      if (sliders.t1) sliders.t1.value = params.thresh1;
      if (sliders.t2) sliders.t2.value = params.thresh2;
      if (sliders.t3) sliders.t3.value = params.thresh3;
      currentPresetKey = preset.key;
      presetButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.key === currentPresetKey)));
      draw();
    }

    function markCustom() {
      currentPresetKey = "";
      presetButtons.forEach((b) => b.setAttribute("aria-pressed", "false"));
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
        onInput: (v) => {
          params.rho = v;
          markCustom();
          reset(s, params.rho);
          playing = !manualMotion;
          if (playPauseBtn) {
            playPauseBtn.disabled = false;
            playPauseBtn.textContent = "Pause";
            playPauseBtn.setAttribute("aria-pressed", "true");
          }
          draw();
        },
      });
      sliders.t1 = Viz.slider(bar, {
        label: "1-neighbour threshold", id: "gg-t1",
        min: 0.10, max: 5.0, step: 0.05, value: params.thresh1,
        format: (v) => v.toFixed(2),
        onInput: (v) => { params.thresh1 = v; markCustom(); },
      });
      sliders.t2 = Viz.slider(bar, {
        label: "2-neighbour threshold", id: "gg-t2",
        min: 0.10, max: 14.0, step: 0.1, value: params.thresh2,
        format: (v) => v.toFixed(2),
        onInput: (v) => { params.thresh2 = v; markCustom(); },
      });
      sliders.t3 = Viz.slider(bar, {
        label: "3+-neighbour threshold", id: "gg-t3",
        min: 0.10, max: 14.0, step: 0.1, value: params.thresh3,
        format: (v) => v.toFixed(2),
        onInput: (v) => { params.thresh3 = v; markCustom(); },
      });

      if (!manualMotion) {
        playPauseBtn = Viz.button(bar, "Pause", function () {
          if (s.stopped) return;
          playing = !playing;
          playPauseBtn.textContent = playing ? "Pause" : "Play";
          playPauseBtn.setAttribute("aria-pressed", String(playing));
        }, { pressed: true });
      }

      Viz.button(bar, "Reset this shape", function () {
        reset(s, params.rho);
        playing = !manualMotion;
        if (playPauseBtn) {
          playPauseBtn.disabled = false;
          playPauseBtn.textContent = "Pause";
          playPauseBtn.setAttribute("aria-pressed", "true");
        }
        draw();
      });

      statusEl = document.createElement("span");
      statusEl.className = "control";
      statusEl.style.color = "var(--ink-muted)";
      bar.appendChild(statusEl);

      diagnosticsEl = document.createElement("span");
      diagnosticsEl.className = "control";
      diagnosticsEl.style.color = "var(--ink-muted)";
      diagnosticsEl.style.fontFamily = "var(--font-mono)";
      diagnosticsEl.style.fontSize = "0.72rem";
      bar.appendChild(diagnosticsEl);

      if (manualMotion) {
        Viz.button(bar, "Grow 60 ticks", function () {
          for (let i = 0; i < 60 && !s.stopped; i++) tick(s, params);
          draw();
        });
      }
    }

    applyPreset(PRESETS.find((p) => p.key === o.preset) || PRESETS[0]);
    draw();
    Viz.onThemeChange(draw);

    return {
      state: s, params: params, anim: anim, draw: draw,
      forceTicks: function (n) { for (let i = 0; i < n && !s.stopped; i++) tick(s, params); draw(); },
      applyPreset: applyPreset,
      get stats() {
        const d = diagnostics(s);
        return {
          attached: s.attachedCount,
          ticks: s.tick,
          stopped: s.stopped,
          stopReason: s.stopReason,
          radius: crystalRadius(s),
          mass: d.mass,
          massDrift: d.mass - s.initialMass,
          maxBoundary: d.maxBoundary,
        };
      },
    };
  }

  window.GGZoo = { mount: mount, PRESETS: PRESETS };

  // Stable, non-visual seam for the fail-closed education verifier. The
  // model remains private; snapshots are copies, so tests cannot mutate a
  // running demo and then accept their own mutation as solver output.
  const educationHooks = window.EducationTestHooks || (window.EducationTestHooks = {});
  educationHooks.ggZoo = Object.freeze({
    constants: Object.freeze({
      radius: R,
      seedRadius: SEED_RADIUS,
      edgeGuardRadius: EDGE_GUARD_RADIUS,
      maxTicks: MAX_TICKS,
    }),
    create: function (options) {
      const o = Object.assign({ preset: "hexagon" }, options || {});
      const preset = PRESETS.find((p) => p.key === o.preset) || PRESETS[0];
      const params = Object.assign({}, preset, o.params || {});
      const s = makeState();
      reset(s, params.rho);

      function snapshot() {
        const d = diagnostics(s);
        return Object.freeze({
          tick: s.tick,
          attachedCount: s.attachedCount,
          stopped: s.stopped,
          stopReason: s.stopReason,
          radius: crystalRadius(s),
          initialMass: s.initialMass,
          recomputedMass: d.mass,
          maxBoundary: d.maxBoundary,
          live: Int32Array.from(s.live),
          vapour: Float64Array.from(s.vapour),
          boundary: Float64Array.from(s.boundary),
          attached: Uint8Array.from(s.attached),
        });
      }

      return Object.freeze({
        advance: function (count) {
          const n = Math.max(0, Math.floor(Number(count) || 0));
          for (let i = 0; i < n && !s.stopped; i++) tick(s, params);
          return snapshot();
        },
        resetDensity: function (rho) {
          params.rho = Number(rho);
          reset(s, params.rho);
          return snapshot();
        },
        parameters: function () {
          return Object.freeze({
            rho: params.rho,
            thresh1: params.thresh1,
            thresh2: params.thresh2,
            thresh3: params.thresh3,
          });
        },
        snapshot: snapshot,
      });
    },
  });
})();
