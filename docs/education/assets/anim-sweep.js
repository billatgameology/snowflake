/* ============================================================================
   The scorecard — what the model actually produced, scored against reality
   ----------------------------------------------------------------------------
   ORIGINAL interactive. The grid below is not illustrative: it is the measured
   result of the project's registered 204-point Phase 6 sweep, transcribed from
   research/phase6-sweep-report.md, which records it as gate evidence.

     protocol hash  9aa2e7c148aad117ba9ab7313bb36c55d4de3fccc3fbda4c2e43cc2af4974983
     execution      commit 3e3f75c, Node v24.13.1 float64 CPU oracle
     run            204/204 points, ~17 h on 6 workers, exit 0

   Scoring follows ADR 0025, which was registered BEFORE the sweep ran:
     - a model cell counts as agreeing only if its habit class matches the
       reference regime's habit
     - "neutral" counts as DISAGREEMENT, because the reference names a habit in
       every regime; the neutral band is the model's, not the reference's
     - points within +/-1.0 C of a regime boundary are excluded from counting
     - the cold mixed regime is reported but kept OUT of the headline, because
       it accepts both pure classes and so cannot discriminate

   Reconstructing the published totals from this grid is a check anyone can
   repeat: it yields 5/6 warm plates, 0/24 columns (8 neutral), 0/60 cold plates
   (58 neutral) and 26/78 in the excluded mixed regime — matching the report.
   ========================================================================= */

(function () {
  "use strict";

  // Temperature columns are (Tm - T) in degrees C, i.e. 2 means -2 C.
  const TEMPS = Array.from({ length: 34 }, (_, i) => i + 2);   // 2..35

  // Supersaturation rows, as a fraction of water saturation.
  const FRACTIONS = [0.10, 0.15, 0.25, 0.40, 0.60, 0.90];

  // The measured diagram. P = plate (AR <= 0.667), C = column (AR >= 1.5),
  // "." = neutral (the model declining to commit to either habit).
  const GRID = {
    0.10: "PPPPPPP..........CCCCCCCCCCCCCCCCC",
    0.15: "PPPPPPP..............CCCCCCCCCCCCC",
    0.25: "PPPPPPP...........................",
    0.40: "PPPPPPP...........................",
    0.60: "PPP...............................",
    0.90: "..................................",
  };

  // Reference regime boundaries measured from the Nakaya diagram, in (Tm - T).
  const BOUNDS = [3.3, 9.9, 21.5];
  const AMBIGUITY = 1.0;   // ADR 0025: +/- this band around a boundary is not counted

  const REGIMES = [
    { key: "plates-warm", from: 0, to: 3.3, habit: "P", label: "Plates", headline: true },
    { key: "columns", from: 3.3, to: 9.9, habit: "C", label: "Columns", headline: true },
    { key: "plates-cold", from: 9.9, to: 21.5, habit: "P", label: "Plates", headline: true },
    { key: "columns-and-plates", from: 21.5, to: 99, habit: "*", label: "Columns and plates", headline: false },
  ];

  function regimeOf(t) {
    for (const r of REGIMES) if (t > r.from && t <= r.to) return r;
    return REGIMES[0];
  }

  /** ADR 0025: is this temperature far enough from every boundary to count? */
  function counted(t) {
    return BOUNDS.every((b) => Math.abs(t - b) > AMBIGUITY);
  }

  function modelClass(f, t) {
    return GRID[f][t - 2];
  }

  /** Score exactly as the registered rule does. */
  function score() {
    const tally = {};
    for (const r of REGIMES) tally[r.key] = { n: 0, agree: 0, disagree: 0, neutral: 0 };
    for (const f of FRACTIONS) {
      for (const t of TEMPS) {
        if (!counted(t)) continue;
        const r = regimeOf(t);
        const m = modelClass(f, t);
        const row = tally[r.key];
        row.n++;
        if (m === ".") { row.neutral++; row.disagree++; continue; }
        const ok = r.habit === "*" ? true : m === r.habit;
        if (ok) row.agree++; else row.disagree++;
      }
    }
    const head = REGIMES.filter((r) => r.headline);
    const n = head.reduce((s, r) => s + tally[r.key].n, 0);
    const agree = head.reduce((s, r) => s + tally[r.key].agree, 0);
    return { tally: tally, headlineN: n, headlineAgree: agree };
  }

  /* ---------------------------------------------------------------- mount -- */

  /**
   *   Sweep.mount(root, { view: "model" })
   * Views: "model" (what came out), "reference" (what nature does),
   *        "agreement" (cell by cell), "counted" (what the rule scores).
   */
  function mount(root, options) {
    const o = Object.assign({ view: "model" }, options || {});
    const body = root.querySelector(".anim__body") || root;
    const bar = root.querySelector(".anim__controls");
    const head = root.querySelector(".anim__head") || body;

    const status = document.createElement("p");
    status.className = "anim__sub";
    status.setAttribute("role", "status");
    status.style.fontWeight = "600";
    status.style.marginTop = "0.35rem";
    head.appendChild(status);

    const W = 760, H = 320;
    const M = { top: 46, right: 16, bottom: 58, left: 74 };
    const cw = (W - M.left - M.right) / TEMPS.length;
    const ch = (H - M.top - M.bottom) / FRACTIONS.length;

    let view = o.view;
    let picked = null;
    let svg = null;

    const S = score();

    function render() {
      if (svg) svg.remove();
      const c = Viz.colors();
      const INK = { P: c.series[0], C: c.series[1], ".": c.muted };

      svg = Viz.createSvg(body, W, H, {
        label:
          "The measured morphology diagram from the project's 204-point sweep: temperature " +
          "across, supersaturation down, each cell showing whether the model grew a plate, a " +
          "column, or neither.",
      });

      /* ---- reference regime bands along the top ---- */
      for (const r of REGIMES) {
        const x0 = M.left + Math.max(0, (r.from - 2 + 1) * cw);
        const x1 = M.left + Math.min(TEMPS.length, (r.to - 2 + 1)) * cw;
        if (x1 <= x0) continue;
        const ink = r.habit === "P" ? c.series[0] : r.habit === "C" ? c.series[1] : c.series[2];
        svg.appendChild(Viz.svgEl("rect", {
          x: x0, y: M.top - 20, width: x1 - x0, height: 14,
          fill: ink, "fill-opacity": r.headline ? 0.3 : 0.14,
          stroke: c.surface, "stroke-width": 1.5,
        }));
        if (x1 - x0 > 52) {
          const tx = Viz.svgEl("text", {
            x: (x0 + x1) / 2, y: M.top - 9, "text-anchor": "middle",
            fill: ink, "font-size": 10, "font-weight": 660, "font-family": "var(--font-sans)",
          });
          tx.textContent = r.label + (r.headline ? "" : " (not scored)");
          svg.appendChild(tx);
        }
      }
      const bandLbl = Viz.svgEl("text", {
        x: M.left - 8, y: M.top - 9, "text-anchor": "end",
        fill: c.inkSecondary, "font-size": 10, "font-weight": 660, "font-family": "var(--font-sans)",
      });
      bandLbl.textContent = "nature:";
      svg.appendChild(bandLbl);

      /* ---- the cells ---- */
      FRACTIONS.forEach(function (f, ri) {
        TEMPS.forEach(function (t, ci) {
          const x = M.left + ci * cw, y = M.top + ri * ch;
          const m = modelClass(f, t);
          const r = regimeOf(t);
          const isCounted = counted(t);
          const agrees = m !== "." && (r.habit === "*" || m === r.habit);

          let fill = INK[m], op = 0.85;
          if (view === "reference") {
            fill = r.habit === "P" ? c.series[0] : r.habit === "C" ? c.series[1] : c.series[2];
          } else if (view === "agreement") {
            fill = !isCounted ? c.rule : agrees ? c.good : c.critical;
            op = !isCounted ? 0.35 : 0.8;
          } else if (view === "counted") {
            const inHead = isCounted && r.headline;
            fill = INK[m];
            op = inHead ? 0.9 : 0.12;
          }

          const cell = Viz.svgEl("rect", {
            x: x + 0.6, y: y + 0.6, width: cw - 1.2, height: ch - 1.2, rx: 1.5,
            fill: fill, "fill-opacity": op,
            stroke: picked && picked[0] === f && picked[1] === t ? c.ink : "none",
            "stroke-width": 2,
          });
          cell.style.cursor = "pointer";
          cell.addEventListener("click", function () { picked = [f, t]; render(); });
          svg.appendChild(cell);
        });
      });

      /* ---- axes ---- */
      TEMPS.forEach(function (t, ci) {
        if (t % 5 !== 0 && t !== 2) return;
        const tx = Viz.svgEl("text", {
          x: M.left + ci * cw + cw / 2, y: H - M.bottom + 16, "text-anchor": "middle",
          fill: c.muted, "font-size": 10, "font-family": "var(--font-sans)",
        });
        tx.textContent = "−" + t;
        svg.appendChild(tx);
      });
      const xt = Viz.svgEl("text", {
        x: M.left + (W - M.left - M.right) / 2, y: H - M.bottom + 36, "text-anchor": "middle",
        fill: c.inkSecondary, "font-size": 12, "font-weight": 600, "font-family": "var(--font-sans)",
      });
      xt.textContent = "Temperature (°C)";
      svg.appendChild(xt);

      FRACTIONS.forEach(function (f, ri) {
        const ty = Viz.svgEl("text", {
          x: M.left - 8, y: M.top + ri * ch + ch / 2 + 3.5, "text-anchor": "end",
          fill: c.muted, "font-size": 10, "font-family": "var(--font-mono)",
        });
        ty.textContent = f.toFixed(2);
        svg.appendChild(ty);
      });
      const yt = Viz.svgEl("text", {
        x: 16, y: M.top + (H - M.top - M.bottom) / 2,
        "text-anchor": "middle", fill: c.inkSecondary, "font-size": 11, "font-weight": 600,
        "font-family": "var(--font-sans)",
        transform: `rotate(-90 16 ${M.top + (H - M.top - M.bottom) / 2})`,
      });
      yt.textContent = "How wet the air is";
      svg.appendChild(yt);

      /* ---- legend + readout ---- */
      const items = view === "agreement"
        ? [{ c: c.good, l: "agrees" }, { c: c.critical, l: "disagrees" }, { c: c.rule, l: "not counted" }]
        : [{ c: c.series[0], l: "plate" }, { c: c.muted, l: "neither" }, { c: c.series[1], l: "column" }];
      items.forEach(function (it, i) {
        const x = M.left + i * 118;
        svg.appendChild(Viz.svgEl("rect", {
          x: x, y: H - 18, width: 11, height: 11, rx: 2, fill: it.c, "fill-opacity": 0.85,
        }));
        const tx = Viz.svgEl("text", {
          x: x + 16, y: H - 8.5, fill: c.inkSecondary, "font-size": 11,
          "font-family": "var(--font-sans)",
        });
        tx.textContent = it.l;
        svg.appendChild(tx);
      });

      if (picked) {
        const [f, t] = picked;
        const m = modelClass(f, t);
        const r = regimeOf(t);
        const isC = counted(t);
        const name = { P: "a plate", C: "a column", ".": "neither — it would not commit" }[m];
        const ref = r.habit === "P" ? "a plate" : r.habit === "C" ? "a column" : "either";
        status.textContent =
          `At −${t} °C, air at ${(f * 100).toFixed(0)}% of water saturation: the model grew ` +
          `${name}. Nature grows ${ref}. ` +
          (!isC ? "This point sits within 1 °C of a regime boundary, so the rule does not count it."
                : !r.headline ? "This regime accepts both habits, so it is reported but kept out of the headline."
                : m !== "." && (r.habit === "*" || m === r.habit) ? "Counted, and it agrees."
                : "Counted, and it disagrees.");
      } else {
        status.textContent =
          `${S.headlineAgree} of ${S.headlineN} scored points agree. ` +
          `Columns ${S.tally.columns.agree}/${S.tally.columns.n}. ` +
          `Cold plates ${S.tally["plates-cold"].agree}/${S.tally["plates-cold"].n}. ` +
          `Zero of the 204 runs was invalid.`;
      }
    }

    if (bar) {
      const views = [
        ["model", "What the model grew"],
        ["reference", "What nature grows"],
        ["agreement", "Agree or not"],
        ["counted", "What the rule counts"],
      ];
      const buttons = [];
      views.forEach(function ([key, label]) {
        const b = Viz.button(bar, label, function () {
          view = key; picked = null;
          buttons.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
          render();
        }, { pressed: key === view });
        buttons.push(b);
      });
      const note = document.createElement("span");
      note.className = "control";
      note.style.color = "var(--ink-muted)";
      note.textContent = "Click any square.";
      bar.appendChild(note);
    }

    render();
    Viz.onThemeChange(render);
    return { score: S, render: render };
  }

  window.Sweep = { mount: mount, score: score, GRID: GRID, TEMPS: TEMPS, FRACTIONS: FRACTIONS };
})();
