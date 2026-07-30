/* ============================================================================
   Try to cheat — why you decide the rules before you look
   ----------------------------------------------------------------------------
   ORIGINAL interactive, and the most important one in Part Two.

   It hands the reader two knobs that genuinely control a real model, and lets
   them tune until the model "matches nature". The score climbs. It feels like
   discovery. Then it points out when they decided what counted as success.

   THE KNOBS ARE NOT INVENTED. They are the centres of the two SDAK dips in
   Libbrecht's published model:

     sigma0_basal broad   0.02 * t^1.75 + 0.3              arXiv:2009.08404v2 p.3 Eq.(2)
     sigma0_prism broad   0.015 * t^2 + 0.02 * t^0.6       arXiv:2306.13087v1 p.7
     basal dip            1 - 0.87 * exp(-(log10 t - log10 C_b)^2 / 0.07)  ibid. p.6, C_b = 4.5
     prism dip            1 - 0.95 * exp(-(log10 t - log10 C_p)^2 / 0.06)  ibid. p.6, C_p = 14.4

   The log is BASE 10. This file used natural log until 2026-07-29; that bug
   changed every score below and is corrected here.

   whichever sigma0 is LOWER is the face that grows, so basal-lower gives a
   column and prism-lower gives a plate. Scoring is ADR 0025's, the same rule
   the project registered before its own sweep.

   THE POINT
   The published dip centres sit at 4.5 and 14.4 C. Those were not measured
   first and found to fit; the model's own documentation classes them as P3 —
   "Nakaya-informed SDAK hypotheses (dip locations chosen to impose agreement
   with the diagram)" (project charter, section 2.7). So a high score at the
   default position is not evidence. It is the knob being where someone put it
   to make the score high. That is why this project reports its no-SDAK sweep
   separately. STATUS of that sweep, as of 2026-07-29: the standing headline is
   3 of 90 (research/phase6-sweep-report.md). An earlier run of the same sweep
   measured 5 of 90 and was INVALIDATED by ADR 0031 — an unregistered CLI default
   supplied a parameter set violating a registered freeze row — so 5 of 90 is
   withdrawn, not merely superseded. And the 3 of 90 is NOT yet gate evidence:
   the report says so in bold, WP5 has not run, and no independent verifier has
   reproduced it. Phase 6 is still in development.

   WHAT THIS IS NOT
   This strip is a SIMPLIFIED PREDICTOR — it asks only which sigma0 curve is
   lower at each temperature. It is not the project's 3-D solver, and it sweeps
   one humidity level rather than six, so it scores out of 15 counting
   temperatures where the project's registered sweep scores out of 90. The two
   numbers are not interchangeable and are never presented as if they were.
   Measured here, with the corrected base-10 log: no dips at all scores 1 of 15,
   and the published dip centres score 15 of 15 — a perfect match, which is the
   whole point. Nothing was discovered by that; the centres were placed where
   they are in order to land there.

   Nothing here is a claim about nature. It is a demonstration of a reasoning
   error, run on real equations so the reader can check that the trap is real.
   ========================================================================= */

(function () {
  "use strict";

  const TEMPS = Array.from({ length: 34 }, (_, i) => i + 2);   // 2..35, as (Tm - T)
  const BOUNDS = [3.3, 9.9, 21.5];
  const AMBIGUITY = 1.0;

  const REGIMES = [
    { from: 0, to: 3.3, habit: "P", headline: true },
    { from: 3.3, to: 9.9, habit: "C", headline: true },
    { from: 9.9, to: 21.5, habit: "P", headline: true },
    { from: 21.5, to: 99, habit: "*", headline: false },
  ];
  const regimeOf = (t) => REGIMES.find((r) => t > r.from && t <= r.to) || REGIMES[0];
  const counted = (t) => BOUNDS.every((b) => Math.abs(t - b) > AMBIGUITY);

  const basalBroad = (t) => 0.02 * Math.pow(t, 1.75) + 0.3;
  const prismBroad = (t) => 0.015 * t * t + 0.02 * Math.pow(t, 0.6);
  // The log in the printed dip formulas is BASE 10, not natural. This file used
  // Math.log until 2026-07-29; that bug inflated the crossing count and every
  // score quoted in the header comment. See the correction in
  // app/scripts/phase6-libbrecht-closed-forms.mjs and anim-sigma0.js.
  const dip = (t, centre, depth, width) =>
    1 - depth * Math.exp(-Math.pow(Math.log10(t) - Math.log10(centre), 2) / width);

  function habitAt(t, cB, cP, useDips) {
    const b = basalBroad(t) * (useDips ? dip(t, cB, 0.87, 0.07) : 1);
    const p = prismBroad(t) * (useDips ? dip(t, cP, 0.95, 0.06) : 1);
    return b < p ? "C" : "P";       // lower barrier wins; basal lower => column
  }

  function scoreAt(cB, cP, useDips) {
    let n = 0, agree = 0;
    for (const t of TEMPS) {
      if (!counted(t)) continue;
      const r = regimeOf(t);
      if (!r.headline) continue;
      n++;
      if (habitAt(t, cB, cP, useDips) === r.habit) agree++;
    }
    return { n, agree };
  }

  /** A short, stable stand-in for a content hash of the frozen settings. */
  function freezeHash(cB, cP) {
    const s = `basal=${cB.toFixed(2)};prism=${cP.toFixed(2)};rule=ADR-0025`;
    let h1 = 0x811c9dc5, h2 = 0x01000193;
    for (let i = 0; i < s.length; i++) {
      h1 = (h1 ^ s.charCodeAt(i)) >>> 0;
      h1 = (h1 * 0x01000193) >>> 0;
      h2 = (h2 + s.charCodeAt(i) * (i + 7)) >>> 0;
    }
    return (h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0")).slice(0, 16);
  }

  /* ---------------------------------------------------------------- mount -- */

  function mount(root, options) {
    const o = Object.assign({}, options || {});
    const body = root.querySelector(".anim__body") || root;
    const bar = root.querySelector(".anim__controls");
    const head = root.querySelector(".anim__head") || body;

    const status = document.createElement("p");
    status.className = "anim__sub";
    status.setAttribute("role", "status");
    status.style.fontWeight = "600";
    status.style.marginTop = "0.35rem";
    head.appendChild(status);

    const W = 720, H = 250;
    const M = { top: 54, right: 20, bottom: 52, left: 96 };
    const cw = (W - M.left - M.right) / TEMPS.length;

    let cB = 4.5, cP = 14.4;
    let mode = "free";        // "free" | "frozen" | "revealed"
    let frozen = null;        // { cB, cP, hash }
    let svg = null;
    let sliders = [];

    function render() {
      if (svg) svg.remove();
      const c = Viz.colors();
      svg = Viz.createSvg(body, W, H, {
        label: "A strip of predicted crystal habits against temperature, compared with the " +
          "habits nature actually produces.",
      });

      const showScore = mode !== "frozen";
      const s = scoreAt(cB, cP, true);

      /* ---- what nature does ---- */
      for (const r of REGIMES) {
        const x0 = M.left + Math.max(0, r.from - 1) * cw;
        const x1 = M.left + Math.min(TEMPS.length, r.to - 1) * cw;
        if (x1 <= x0) continue;
        const ink = r.habit === "P" ? c.series[0] : r.habit === "C" ? c.series[1] : c.series[2];
        svg.appendChild(Viz.svgEl("rect", {
          x: x0, y: M.top, width: x1 - x0, height: 30,
          fill: ink, "fill-opacity": r.headline ? 0.32 : 0.12,
          stroke: c.surface, "stroke-width": 1.5,
        }));
      }

      /* ---- what the model predicts ---- */
      TEMPS.forEach(function (t, i) {
        const h = habitAt(t, cB, cP, true);
        const ink = h === "P" ? c.series[0] : c.series[1];
        svg.appendChild(Viz.svgEl("rect", {
          x: M.left + i * cw + 0.5, y: M.top + 44, width: cw - 1, height: 30,
          fill: ink, "fill-opacity": 0.85,
        }));
        if (showScore && counted(t) && regimeOf(t).headline) {
          const ok = h === regimeOf(t).habit;
          svg.appendChild(Viz.svgEl("rect", {
            x: M.left + i * cw + 0.5, y: M.top + 80, width: cw - 1, height: 8, rx: 2,
            fill: ok ? c.good : c.critical, "fill-opacity": 0.9,
          }));
        }
      });

      [["nature", M.top + 15], ["model", M.top + 59], [showScore ? "scored" : "", M.top + 88]]
        .forEach(function ([label, y]) {
          if (!label) return;
          const tx = Viz.svgEl("text", {
            x: M.left - 10, y: y + 4, "text-anchor": "end", fill: c.inkSecondary,
            "font-size": 11, "font-weight": 660, "font-family": "var(--font-sans)",
          });
          tx.textContent = label;
          svg.appendChild(tx);
        });

      /* ---- axis ---- */
      TEMPS.forEach(function (t, i) {
        if (t % 5 !== 0 && t !== 2) return;
        const tx = Viz.svgEl("text", {
          x: M.left + i * cw + cw / 2, y: H - M.bottom + 30, "text-anchor": "middle",
          fill: c.muted, "font-size": 10, "font-family": "var(--font-sans)",
        });
        tx.textContent = "−" + t;
        svg.appendChild(tx);
      });
      const xt = Viz.svgEl("text", {
        x: M.left + (W - M.left - M.right) / 2, y: H - 6, "text-anchor": "middle",
        fill: c.inkSecondary, "font-size": 12, "font-weight": 600, "font-family": "var(--font-sans)",
      });
      xt.textContent = "Temperature (°C)";
      svg.appendChild(xt);

      /* ---- headline ---- */
      const big = Viz.svgEl("text", {
        x: M.left, y: 30,
        fill: showScore ? (s.agree >= s.n * 0.8 ? c.good : c.ink) : c.muted,
        "font-size": 19, "font-weight": 700, "font-family": "var(--font-sans)",
      });
      big.textContent = showScore ? `${s.agree} of ${s.n} agree` : "score hidden until you run it";
      svg.appendChild(big);

      /* ---- narration ---- */
      if (mode === "free") {
        status.textContent =
          "Drag the two dip positions until the model matches nature. A perfect 15 of 15 is " +
          "reachable — but notice that you can see the score the whole time you are tuning.";
      } else if (mode === "frozen") {
        status.textContent =
          `Frozen at basal ${frozen.cB.toFixed(2)} °C, prism ${frozen.cP.toFixed(2)} °C — ` +
          `hash ${frozen.hash}. The sliders are locked and the score is hidden. Now run it.`;
      } else {
        const same = Math.abs(frozen.cB - 4.5) < 0.06 && Math.abs(frozen.cP - 14.4) < 0.06;
        status.textContent =
          `You scored ${s.agree} of ${s.n} — and you committed to that answer before you saw it. ` +
          (same
            ? "You also left the dips where the papers put them. Those positions were chosen to " +
              "match this diagram in the first place, so agreement here is not evidence."
            : "Move the dips anywhere else and the score collapses, which tells you the score is " +
              "measuring your knob, not nature.");
      }
    }

    function rebuildControls() {
      if (!bar) return;
      bar.textContent = "";
      sliders = [];

      if (mode === "free" || mode === "frozen") {
        sliders.push(Viz.slider(bar, {
          label: "Basal dip at", id: "prereg-b",
          min: 2, max: 20, step: 0.1, value: cB,
          format: (v) => "−" + v.toFixed(1) + " °C",
          onInput: function (v) { if (mode === "free") { cB = v; render(); } },
        }));
        sliders.push(Viz.slider(bar, {
          label: "Prism dip at", id: "prereg-p",
          min: 4, max: 32, step: 0.1, value: cP,
          format: (v) => "−" + v.toFixed(1) + " °C",
          onInput: function (v) { if (mode === "free") { cP = v; render(); } },
        }));
        for (const s of sliders) if (mode === "frozen") s.input.disabled = true;
      }

      if (mode === "free") {
        Viz.button(bar, "Freeze these settings", function () {
          frozen = { cB: cB, cP: cP, hash: freezeHash(cB, cP) };
          mode = "frozen";
          rebuildControls(); render();
        });
      } else if (mode === "frozen") {
        Viz.button(bar, "Run it", function () { mode = "revealed"; rebuildControls(); render(); });
      } else {
        Viz.button(bar, "Start over", function () {
          mode = "free"; frozen = null; cB = 4.5; cP = 14.4;
          rebuildControls(); render();
        });
        const note = document.createElement("span");
        note.className = "control";
        note.style.color = "var(--ink-muted)";
        note.textContent =
          "Turn the dips off entirely and this strip scores 1 of 15. That is the arrangement " +
          "the project actually registered and ran — as a full 3-D sweep over six humidity " +
          "levels, where it scored 3 of 90. Even that number is not finished evidence: the " +
          "report carrying it says so, because no independent verifier has reproduced it yet.";
        bar.appendChild(note);
      }
    }

    rebuildControls();
    render();
    Viz.onThemeChange(render);
    return { scoreAt: scoreAt, habitAt: habitAt };
  }

  window.Prereg = { mount: mount, scoreAt: scoreAt, habitAt: habitAt };
})();
