/* ============================================================================
   Try to cheat — why you decide the rules before you look
   ----------------------------------------------------------------------------
   ORIGINAL interactive, and the most important one in Part Two.

   It hands the reader two knobs from a published parameterization, then uses an
   intentionally inadmissible sigma0-order proxy to tune against the Nakaya
   diagram. The score climbs. It feels like discovery. Then it exposes both
   errors: tuning after seeing the target and substituting input order for a
   three-dimensional forward-run habit.

   THE KNOBS ARE NOT INVENTED. They are the centres of the two SDAK dips in
   Libbrecht's published model:

     sigma0_basal broad   0.02 * t^1.75 + 0.3              arXiv:2009.08404v2 p.3 Eq.(2)
     sigma0_prism broad   0.015 * t^2 + 0.02 * t^0.6       arXiv:2306.13087v1 p.7
     basal dip            1 - 0.87 * exp(-(log10 t - log10 C_b)^2 / 0.07)  ibid. p.6, C_b = 4.5
     prism dip            1 - 0.95 * exp(-(log10 t - log10 C_p)^2 / 0.06)  ibid. p.6, C_p = 14.4

   The source prints "log" without naming its base. This project registers a
   base-10 transcription as a P4 reading supported by Figure 1's width. This file
   used natural log until 2026-07-29; that mismatch with the registered reading
   changed every score below and is corrected here.

   The strip below deliberately maps "basal sigma0 lower" to C and "prism
   sigma0 lower" to P. That mapping is not physics and is not ADR 0025's 3-D
   morphology evaluator. It exists here only to demonstrate how an invalid
   proxy can be tuned to its target.

   THE POINT
   The published dip centres sit at 4.5 and 14.4 C. Those were not measured
   first and found to fit; the model's own documentation classes them as P3 —
   "Nakaya-informed SDAK hypotheses (dip locations chosen to impose agreement
   with the diagram)" (project charter, section 2.7). So a high score at the
   default position is not evidence. It is the knob being where someone put it
   to make the proxy score high. That is why this project reports its 3-D
   forward sweeps separately. CURRENT STATUS: the broad-facet CAK arm measured
   3 of 90 and the everywhere-narrow M1 arm measured 54 of 90 on the common
   denominator (54 of 78 in its arm-specific scope). Both are historical
   measured-only results, not the registered replacement gate. An earlier run
   of the CAK sweep
   measured 5 of 90 and was INVALIDATED by ADR 0031 — an unregistered CLI default
   supplied a parameter set violating a registered freeze row — so 5 of 90 is
   withdrawn, not merely superseded. Phase 6 later completed on an accepted
   negative finding; the closure does not validate the model. Phase 7's GPU
   cohort and held-out validation obligations remain not started.

   WHAT THIS IS NOT
   This strip is an INVALID PROXY — it asks only which sigma0 curve is lower at
   each temperature under an equal-prefactor, equal-positive-field assumption,
   then assigns a morphology label. It is a temperature-only order diagnostic,
   not a humidity sweep or the project's 3-D solver, so it scores out of 15
   temperatures where the project's registered sweep scores 90 temperature-field
   points. The two numbers are not interchangeable.
   Measured here, with the project's corrected base-10 transcription: no dips at all scores 1 of 15,
   and the published dip centres score 15 of 15 — a perfect match, which is the
   whole point. Nothing was discovered by that; the centres were placed where
   they are in order to land there.

   Nothing here is a claim about nature or a validation score. It is a
   demonstration of a reasoning error, run on real equations so the reader can
   check that the trap is real.
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
  // The source leaves the log base unspecified. The project registers a
  // Figure-1-width-supported P4 base-10 transcription. This file used Math.log
  // until 2026-07-29; that mismatch inflated the equality count and every score
  // quoted in the header comment. See the correction in
  // app/scripts/phase6-libbrecht-closed-forms.mjs and anim-sigma0.js.
  const dip = (t, centre, depth, width) =>
    1 - depth * Math.exp(-Math.pow(Math.log10(t) - Math.log10(centre), 2) / width);

  function orderAt(t, cB, cP, useDips) {
    const b = basalBroad(t) * (useDips ? dip(t, cB, 0.87, 0.07) : 1);
    const p = prismBroad(t) * (useDips ? dip(t, cP, 0.95, 0.06) : 1);
    return b < p ? "basal-lower" : "prism-lower";
  }

  // Deliberately inadmissible mapping used only to demonstrate target leakage.
  function proxyLabelAt(t, cB, cP, useDips) {
    return orderAt(t, cB, cP, useDips) === "basal-lower" ? "C" : "P";
  }

  function scoreAt(cB, cP, useDips) {
    let n = 0, agree = 0;
    for (const t of TEMPS) {
      if (!counted(t)) continue;
      const r = regimeOf(t);
      if (!r.headline) continue;
      n++;
      if (proxyLabelAt(t, cB, cP, useDips) === r.habit) agree++;
    }
    return { n, agree };
  }

  /** An illustrative 16-character token. It is not a content or protocol hash. */
  function illustrativeToken(cB, cP) {
    const s = `basal=${cB.toFixed(2)};prism=${cP.toFixed(2)};teaching-demo`;
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
        label: "An intentionally invalid sigma0-order proxy compared with a reference habit " +
          "diagram to demonstrate target leakage. It is not a physical prediction.",
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

      /* ---- what the invalid input-order proxy labels ---- */
      TEMPS.forEach(function (t, i) {
        const h = proxyLabelAt(t, cB, cP, true);
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

      [["reference", M.top + 15], ["invalid proxy", M.top + 59], [showScore ? "proxy score" : "", M.top + 88]]
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
      big.textContent = showScore ? `${s.agree} of ${s.n} proxy labels agree` : "proxy score hidden until you run it";
      svg.appendChild(big);

      /* ---- narration ---- */
      if (mode === "free") {
        status.textContent =
          "Drag the two dip positions until this invalid proxy matches the reference. A perfect " +
          "15 of 15 is reachable — but the target is visible while you tune.";
      } else if (mode === "frozen") {
        status.textContent =
          `Frozen at basal ${frozen.cB.toFixed(2)} °C, prism ${frozen.cP.toFixed(2)} °C — ` +
          `illustrative token ${frozen.token}. This is not a content hash, protocol hash, or ` +
          `ADR 0025 implementation. The sliders are locked and the score is hidden. Now run it.`;
      } else {
        const same = Math.abs(frozen.cB - 4.5) < 0.06 && Math.abs(frozen.cP - 14.4) < 0.06;
        status.textContent =
          `The invalid proxy scored ${s.agree} of ${s.n} — after you committed to its settings. ` +
          (same
            ? "You also left the dips where the papers put them. Those positions were chosen to " +
              "match this diagram in the first place, so agreement here is not evidence. A " +
              "sigma0-order proxy is not a 3-D habit evaluator in any case."
            : "Many different centre pairs can earn the same proxy score, while other settings " +
              "score lower. This coarse target-matching exercise cannot identify the published " +
              "centres; it is measuring adjustable knobs against a visible target, not nature.");
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
          frozen = { cB: cB, cP: cP, token: illustrativeToken(cB, cP) };
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
          "Turn the dips off and this deliberately invalid proxy scores 1 of 15. The separate " +
          "3-D CAK arm measured 3 of 90; M1 measured 54 of 90 common-scope (54 of 78 in its " +
          "arm scope). Neither measured-only result closes the replacement gate.";
        bar.appendChild(note);
      }
    }

    rebuildControls();
    render();
    Viz.onThemeChange(render);
    return { scoreAt: scoreAt, orderAt: orderAt, proxyLabelAt: proxyLabelAt };
  }

  window.EducationTestHooks = window.EducationTestHooks || {};
  window.EducationTestHooks.preregister = Object.freeze({
    schemaVersion: 1,
    semanticContract: Object.freeze({
      quantity: "temperature-only-equal-field-coefficient-order-proxy",
      fieldSweep: false,
      habitProxy: true,
      proxyIsValid: false,
      implementsAdr0025: false,
      tokenIsContentHash: false,
      tokenIsProtocolHash: false,
    }),
    constants: Object.freeze({
      basalCentreC: 4.5,
      prismCentreC: 14.4,
      basalDepth: 0.87,
      prismDepth: 0.95,
      basalWidth: 0.07,
      prismWidth: 0.06,
      logBase: 10,
    }),
    evaluate: function (t, cB, cP, useDips) {
      return Object.freeze({
        basalBroad: basalBroad(t),
        prismBroad: prismBroad(t),
        basalDip: dip(t, cB, 0.87, 0.07),
        prismDip: dip(t, cP, 0.95, 0.06),
        order: orderAt(t, cB, cP, useDips),
        proxyLabel: proxyLabelAt(t, cB, cP, useDips),
      });
    },
    scoreAt: scoreAt,
    illustrativeToken: illustrativeToken,
  });

  window.Prereg = { mount: mount, scoreAt: scoreAt, orderAt: orderAt, proxyLabelAt: proxyLabelAt };
})();
