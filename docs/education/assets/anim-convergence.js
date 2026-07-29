/* ============================================================================
   "Converged" is not one question — it is two
   ----------------------------------------------------------------------------
   ORIGINAL interactive, and a live re-creation of a real bug this project found.

   Between growth steps the vapour field is relaxed toward its steady state. The
   obvious way to decide when to stop is to watch how much the field still
   CHANGES each sweep — the residual — and stop when that is small enough.

   That test can be passed by a field that is badly wrong. The project measured
   it: residual-only convergence accepted fields "whose imbalance grew with
   domain size" (project charter, section on how quasi-static is enforced;
   decision 0006). The fix was to make convergence DUAL — the field must satisfy
   a stated residual tolerance AND a divergence identity, which is a
   conservation check: whatever flows in across the far boundary must equal
   whatever the crystal absorbs.

   This demo reproduces the failure honestly. It runs a real Gauss-Seidel
   relaxation of Laplace's equation on a square grid with an absorbing disc at
   the centre and the outer ring held at 1, gives every domain size the SAME
   fixed sweep budget, and reports both numbers. Measured here:

       N     residual     imbalance
      24      1.9e-7          0.0%
      32      2.4e-5          0.8%
      48      2.5e-4         20.1%
      64      4.2e-4         52.7%
      96      5.0e-4         91.8%
     128      5.4e-4         99.3%

   Every one of those passes a residual tolerance of 1e-3. The last one is
   99.3% wrong. That is the entire argument for the second check, and the reader
   can reproduce it by dragging the slider.

   The information-propagation reason: a Gauss-Seidel sweep moves information
   one cell, so a domain of width N needs on the order of N-squared sweeps for
   the boundary to "hear" the sink. A fixed budget therefore buys less and less
   global convergence as the domain grows, while the LOCAL change per sweep goes
   quiet either way.
   ========================================================================= */

(function () {
  "use strict";

  const TOL = 1e-3;   // the residual tolerance being illustrated

  function solve(N, sweeps) {
    const v = new Float64Array(N * N).fill(1);
    const mid = (N - 1) / 2;
    const r0 = Math.max(2, N * 0.06);
    const solid = new Uint8Array(N * N);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (Math.hypot(x - mid, y - mid) <= r0) { solid[y * N + x] = 1; v[y * N + x] = 0; }
      }
    }

    let residual = 0;
    for (let s = 0; s < sweeps; s++) {
      residual = 0;
      for (let y = 1; y < N - 1; y++) {
        for (let x = 1; x < N - 1; x++) {
          const i = y * N + x;
          if (solid[i]) { v[i] = 0; continue; }
          const nv = 0.25 * (v[i - 1] + v[i + 1] + v[i - N] + v[i + N]);
          const d = Math.abs(nv - v[i]);
          if (d > residual) residual = d;
          v[i] = nv;
        }
      }
      for (let k = 0; k < N; k++) {
        v[k] = 1; v[(N - 1) * N + k] = 1; v[k * N] = 1; v[k * N + N - 1] = 1;
      }
    }

    // the divergence identity: what comes in must equal what is taken out
    let inflow = 0, outflow = 0;
    for (let k = 1; k < N - 1; k++) {
      inflow += (1 - v[N + k]) + (1 - v[(N - 2) * N + k]) + (1 - v[k * N + 1]) + (1 - v[k * N + N - 2]);
    }
    for (let y = 1; y < N - 1; y++) {
      for (let x = 1; x < N - 1; x++) {
        if (!solid[y * N + x]) continue;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (!solid[ny * N + nx]) outflow += v[ny * N + nx];
        }
      }
    }
    const imbalance = Math.abs(inflow - outflow) / Math.max(inflow, outflow, 1e-12);
    return { v, solid, N, residual, imbalance };
  }

  function hexToRgb(hex) {
    const h = hex.replace("#", "").trim();
    return h.length === 3
      ? h.split("").map((ch) => parseInt(ch + ch, 16))
      : [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function mount(root, options) {
    const o = Object.assign({ sweeps: 300, size: 300 }, options || {});
    const body = root.querySelector(".anim__body") || root;
    const bar = root.querySelector(".anim__controls");
    const head = root.querySelector(".anim__head") || body;

    const status = document.createElement("p");
    status.className = "anim__sub";
    status.setAttribute("role", "status");
    status.style.fontWeight = "600";
    status.style.marginTop = "0.35rem";
    head.appendChild(status);

    const wrap = document.createElement("div");
    wrap.style.display = "flex";
    wrap.style.flexWrap = "wrap";
    wrap.style.gap = "1.25rem";
    wrap.style.alignItems = "flex-start";
    body.appendChild(wrap);

    const left = document.createElement("div");
    const right = document.createElement("div");
    right.style.flex = "1 1 300px";
    right.style.minWidth = "280px";
    wrap.appendChild(left);
    wrap.appendChild(right);

    const SIZE = o.size;
    const view = Viz.createCanvas(left, SIZE, SIZE, {
      label: "The vapour field around an absorbing disc, relaxed with a fixed number of sweeps.",
    });
    const buffer = document.createElement("canvas");
    const bctx = buffer.getContext("2d");

    let N = 48;
    let result = null;
    let svg = null;

    function draw() {
      const c = Viz.colors();
      const ramp = c.seq.map(hexToRgb);
      const surface = hexToRgb(c.surface);
      const ice = hexToRgb(c.series[0]);

      buffer.width = N; buffer.height = N;
      const img = bctx.createImageData(N, N);
      for (let i = 0; i < N * N; i++) {
        const p = i * 4;
        img.data[p + 3] = 255;
        if (result.solid[i]) {
          img.data[p] = ice[0]; img.data[p + 1] = ice[1]; img.data[p + 2] = ice[2];
        } else {
          const dep = 1 - Math.max(0, Math.min(1, result.v[i]));
          const t = dep * (ramp.length - 1);
          const lo = ramp[Math.floor(t)], hi = ramp[Math.min(ramp.length - 1, Math.ceil(t))];
          const f = t - Math.floor(t), a = 0.85 * dep;
          for (let k = 0; k < 3; k++) {
            img.data[p + k] = surface[k] + (lo[k] + (hi[k] - lo[k]) * f - surface[k]) * a;
          }
        }
      }
      bctx.putImageData(img, 0, 0);
      view.ctx.imageSmoothingEnabled = false;
      view.ctx.clearRect(0, 0, SIZE, SIZE);
      view.ctx.drawImage(buffer, 0, 0, N, N, 0, 0, SIZE, SIZE);
    }

    function meters() {
      if (svg) svg.remove();
      const c = Viz.colors();
      const W = 340, H = 200;
      svg = Viz.createSvg(right, W, H, { label: "Two convergence checks, side by side." });

      const rows = [
        {
          label: "Residual — how much it still changes",
          value: result.residual, max: 3e-3,
          pass: result.residual < TOL,
          text: result.residual.toExponential(1),
          note: "tolerance 1×10⁻³",
        },
        {
          label: "Imbalance — in minus out",
          value: result.imbalance, max: 1,
          pass: result.imbalance < 0.01,
          text: (100 * result.imbalance).toFixed(1) + "%",
          note: "should be ~0",
        },
      ];

      rows.forEach(function (r, i) {
        const y = 26 + i * 88;
        const lbl = Viz.svgEl("text", {
          x: 0, y: y, fill: c.inkSecondary, "font-size": 12, "font-weight": 620,
          "font-family": "var(--font-sans)",
        });
        lbl.textContent = r.label;
        svg.appendChild(lbl);

        svg.appendChild(Viz.svgEl("rect", {
          x: 0, y: y + 10, width: W - 70, height: 16, rx: 4,
          fill: c.sunken, stroke: c.rule, "stroke-width": 1,
        }));
        const frac = Math.max(0, Math.min(1, r.value / r.max));
        svg.appendChild(Viz.svgEl("rect", {
          x: 0, y: y + 10, width: Math.max(2, (W - 70) * frac), height: 16, rx: 4,
          fill: r.pass ? c.good : c.critical, "fill-opacity": 0.85,
        }));

        const val = Viz.svgEl("text", {
          x: W - 62, y: y + 23, fill: r.pass ? c.good : c.critical,
          "font-size": 13, "font-weight": 700, "font-family": "var(--font-mono)",
        });
        val.textContent = r.text;
        svg.appendChild(val);

        const verdict = Viz.svgEl("text", {
          x: 0, y: y + 44, fill: r.pass ? c.good : c.critical,
          "font-size": 12, "font-weight": 660, "font-family": "var(--font-sans)",
        });
        verdict.textContent = (r.pass ? "PASSES" : "FAILS") + " — " + r.note;
        svg.appendChild(verdict);
      });
    }

    function recompute() {
      result = solve(N, o.sweeps);
      draw();
      meters();
      const residualOk = result.residual < TOL;
      const balanceOk = result.imbalance < 0.01;
      status.textContent = residualOk && !balanceOk
        ? `${N}×${N}: the residual check says this field has converged. The balance check says ` +
          `${(100 * result.imbalance).toFixed(0)}% of the vapour is unaccounted for. Only one of them is right.`
        : residualOk && balanceOk
        ? `${N}×${N}: both checks pass. At this size the sweep budget really is enough.`
        : `${N}×${N}: the residual check itself has not settled yet.`;
    }

    if (bar) {
      Viz.slider(bar, {
        label: "Domain size", id: "conv-n",
        min: 24, max: 128, step: 8, value: N,
        format: (v) => v + "×" + v,
        onInput: function (v) { N = v; recompute(); },
      });
      const note = document.createElement("span");
      note.className = "control";
      note.style.color = "var(--ink-muted)";
      note.textContent = `Every size gets the same ${o.sweeps} sweeps.`;
      bar.appendChild(note);
    }

    recompute();
    Viz.onThemeChange(function () { draw(); meters(); });
    return { solve: solve, recompute: recompute };
  }

  window.Convergence = { mount: mount, solve: solve };
})();
