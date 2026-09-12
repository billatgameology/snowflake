/* ============================================================================
   The scorecard — what the model actually produced, scored against the registered reference
   ----------------------------------------------------------------------------
   ORIGINAL interactive. The grids below are not illustrative: they are the
   measured character grids of two historical 204-point CAK Phase 6 sweeps.
   TWO runs are carried because the first was withdrawn. They come from two
   revisions of research/phase6-sweep-report.md, which prints one grid at each
   revision. This module is a CAK correction comparison; it does not display the
   separately completed M1 arm:

     CAK      the corrected historical re-sweep. Headline 3/90.
              Class totals 6 plate, 168 neutral, 30 column, 0 invalid.
              Transcribed from research/phase6-sweep-report.md. It is a preserved,
              independently re-derived measured-only record. Phase 6 later closed
              on an accepted negative finding; that closure does not upgrade CAK
              to validation evidence.
     CAK_A1   the first run, headline 5/90, INVALIDATED by ADR 0031.
              Transcribed from research/phase6-sweep-report.md at its superseded
              revision, commit 6995868 — it is NOT in the file at HEAD. Its
              artifacts are preserved unmodified at
              evidence/phase6-sweep-6995868-cak-a1-superseded/.

   Why the first was withdrawn: runner/src/phase6-sweep.ts emitted no
   --param-set, so the CLI default at runner/src/main.ts:535 supplied CAK_A1, in
   which A_prism is identically 1 — while PHASE6_INTERPOLATION registered
   aPrism as "piecewise-linear-in-(Tm-T)", distinct from aBasal "constant-1".
   All 204 runs violated a registered freeze row. They are therefore inadmissible
   as evidence for that registered protocol. Their bytes remain a historical
   record of what CAK_A1 produced. ADR 0031's own words: "an unregistered CLI
   default silently overrode a registered freeze row."

   The correction was PREDICTED BEFORE IT RAN. ADR 0031 registered that the
   headline would fall "from 5/90 to approximately 2/90", stating "the corrected
   result is expected to be worse, and that is the point." Outcome: 3/90 —
   direction correct, one point pessimistic. Carrying both runs lets a reader
   watch that correction happen instead of taking it on trust.

   Scoring follows ADR 0025, registered BEFORE either sweep ran:
     - a model cell counts as agreeing only if its habit class matches the
       reference regime's habit
     - "neutral" counts as DISAGREEMENT, because the reference names a habit in
       every regime; the neutral band is the model's, not the reference's
     - points within +/-1.0 C of a regime boundary are excluded from counting
     - the cold mixed regime is reported but kept OUT of the headline, because
       it accepts both pure classes and so cannot discriminate

   Reconstructing the published totals is a check anyone can repeat, and this
   module does it rather than hard-coding the answer: re-implementing the rule
   over the CAK grid yields 3/6 warm plates, 0/24 columns, 0/60 cold plates —
   headline 3/90 — and over CAK_A1 it yields 5/6, 0/24, 0/60 — headline 5/90.
   Both match the report.

   The on-screen provenance line names which arm is showing and what its status
   is. Do not remove it: without it a withdrawn grid reads as a live result.
   ========================================================================= */

(function () {
  "use strict";

  // Temperature columns are (Tm - T) in degrees C, i.e. 2 means -2 C.
  const TEMPS = Array.from({ length: 34 }, (_, i) => i + 2);   // 2..35

  // Each row is a fraction of the water-saturation supersaturation ceiling,
  // not relative humidity.
  const FRACTIONS = [0.10, 0.15, 0.25, 0.40, 0.60, 0.90];

  // The measured diagrams. P = plate (AR <= 0.667), C = column (AR >= 1.5),
  // "." = neutral (the model declining to commit to either habit).
  //
  // TWO ARMS, because the first one was withdrawn and re-run. Both are
  // transcribed verbatim from research/phase6-sweep-report.md.
  const ARMS = {
    // The corrected historical re-sweep, parameter set CAK,
    // in which A_prism follows the registered piecewise interpolation.
    // Headline 3 of 90. Class totals 6 plate, 168 neutral, 30 column, 0 invalid.
    cak: {
      label: "Corrected historical run (CAK)",
      note: "measured-only; not the replacement gate",
      grid: {
        0.10: "PPP..............CCCCCCCCCCCCCCCCC",
        0.15: "PP...................CCCCCCCCCCCCC",
        0.25: "P.................................",
        0.40: "..................................",
        0.60: "..................................",
        0.90: "..................................",
      },
    },
    // The WITHDRAWN run: parameter set CAK_A1, in which A_prism was identically
    // 1 — a value the frozen protocol never registered. Headline 5 of 90.
    // Invalidated by ADR 0031; artifacts preserved unmodified at
    // evidence/phase6-sweep-6995868-cak-a1-superseded/.
    cakA1: {
      label: "Withdrawn run (CAK_A1)",
      note: "invalidated by ADR 0031",
      grid: {
        0.10: "PPPPPPP..........CCCCCCCCCCCCCCCCC",
        0.15: "PPPPPPP..............CCCCCCCCCCCCC",
        0.25: "PPPPPPP...........................",
        0.40: "PPPPPPP...........................",
        0.60: "PPP...............................",
        0.90: "..................................",
      },
    },
  };

  let ARM = "cak";

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

  function modelClass(f, t, arm) {
    return ARMS[arm || ARM].grid[f][t - 2];
  }

  /** Score exactly as the registered rule does. */
  function scoreArm(arm) {
    const tally = {};
    for (const r of REGIMES) tally[r.key] = { n: 0, agree: 0, disagree: 0, neutral: 0 };
    for (const f of FRACTIONS) {
      for (const t of TEMPS) {
        if (!counted(t)) continue;
        const r = regimeOf(t);
        const m = modelClass(f, t, arm);
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

  function score() {
    return scoreArm(ARM);
  }

  /* ---------------------------------------------------------------- mount -- */

  /**
   *   Sweep.mount(root, { view: "model" })
   * Views: "model" (what came out), "reference" (what the registered reference expects),
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

    // Non-removable provenance line: says which of the two runs is on screen and
    // what its standing is, so neither historical grid can read as the current gate.
    const provenance = document.createElement("p");
    provenance.className = "anim__sub";
    provenance.style.marginTop = "0.5rem";
    provenance.style.paddingLeft = "0.7rem";
    provenance.style.color = "var(--ink-secondary)";
    head.appendChild(provenance);

    function paintProvenance() {
      const corrected = ARM === "cak";
      provenance.style.borderLeft =
        "3px solid " + (corrected ? "var(--status-warning)" : "var(--status-critical)");
      provenance.innerHTML = corrected
        ? "<strong>Historical measured-only CAK record.</strong> Headline 3 of 90. " +
          "This is the corrected re-sweep run after the first attempt was withdrawn. Its bytes " +
          "and measurements are preserved, but it did not execute R15 and is not replacement-gate evidence."
        : "<strong>Withdrawn protocol evidence; preserved historical run.</strong> The project invalidated this run itself in " +
          "decision&nbsp;0031: an unregistered command-line default had overridden a registered " +
          "parameter, so none of its 204 rows is admissible for that registered protocol. It then registered the expected " +
          "corrected headline <em>in advance</em> &mdash; about 2 of 90 &mdash; and the corrected " +
          "run came in at 3 of 90.";
    }

    const W = 760, H = 320;
    const M = { top: 46, right: 16, bottom: 58, left: 74 };
    const cw = (W - M.left - M.right) / TEMPS.length;
    const ch = (H - M.top - M.bottom) / FRACTIONS.length;

    let view = o.view;
    let picked = null;
    let svg = null;

    let S = score();

    /* The 34-by-6 SVG is a useful overview but its cells cannot also be
       finger-sized on a 390 px screen. Keep the complete grid and add a
       native, keyboard/touch-accessible coordinate reader for narrow screens. */
    const picker = document.createElement("div");
    picker.className = "sweep-mobile-picker";
    picker.setAttribute("aria-label", "Touch-accessible sweep point reader");

    function pickerField(labelText, suffix, values, format) {
      const label = document.createElement("label");
      const id = `${root.id || "sweep"}-${suffix}`;
      label.htmlFor = id;
      const title = document.createElement("span");
      title.textContent = labelText;
      const select = document.createElement("select");
      select.id = id;
      values.forEach(function (value) {
        const option = document.createElement("option");
        option.value = String(value);
        option.textContent = format(value);
        select.appendChild(option);
      });
      label.appendChild(title);
      label.appendChild(select);
      picker.appendChild(label);
      return select;
    }

    const tempPicker = pickerField(
      "Temperature",
      "temperature-picker",
      TEMPS,
      (temperature) => `−${temperature} °C`,
    );
    const fractionPicker = pickerField(
      "Water-saturation ceiling fraction f",
      "fraction-picker",
      FRACTIONS,
      (fraction) => fraction.toFixed(2),
    );
    const mobileReadout = document.createElement("p");
    mobileReadout.className = "sweep-mobile-readout";
    mobileReadout.setAttribute("role", "status");
    mobileReadout.textContent = "Choose a temperature and fraction to read one exact sweep cell.";
    picker.appendChild(mobileReadout);
    body.appendChild(picker);

    function pickFromNativeControls() {
      picked = [Number(fractionPicker.value), Number(tempPicker.value)];
      render();
    }
    tempPicker.addEventListener("change", pickFromNativeControls);
    fractionPicker.addEventListener("change", pickFromNativeControls);

    function render() {
      paintProvenance();
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
      bandLbl.textContent = "registered reference:";
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
          cell.addEventListener("click", function () {
            picked = [f, t];
            tempPicker.value = String(t);
            fractionPicker.value = String(f);
            render();
          });
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
      yt.textContent = "Fraction of water-saturation supersaturation ceiling";
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
          `At −${t} °C, f = ${f.toFixed(2)}, a fraction of the water-saturation supersaturation ceiling: the model grew ` +
          `${name}. The registered reference expects ${ref}. ` +
          (!isC ? "This point sits within 1 °C of a regime boundary, so the rule does not count it."
                : !r.headline ? "This regime accepts both habits, so it is reported but kept out of the headline."
                : m !== "." && (r.habit === "*" || m === r.habit) ? "Counted, and it agrees."
                : "Counted, and it disagrees.");
      } else {
        status.textContent =
          `${ARMS[ARM].label}: ${S.headlineAgree} of ${S.headlineN} scored points agree. ` +
          `Columns ${S.tally.columns.agree}/${S.tally.columns.n}. ` +
          `Cold plates ${S.tally["plates-cold"].agree}/${S.tally["plates-cold"].n}. ` +
          (ARM === "cak"
            ? `Zero of 204 CAK rows was model-invalid.`
            : `Zero of 204 CAK_A1 rows was model-invalid, but all 204 are protocol-inadmissible because the frozen parameter row was violated.`);
      }
      mobileReadout.textContent = picked
        ? status.textContent
        : "Choose a temperature and fraction to read one exact sweep cell.";
    }

    if (bar) {
      const views = [
        ["model", "What the model grew"],
        ["reference", "What the registered reference expects"],
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
      // Switch between the corrected historical CAK run and the one the project withdrew.
      const armBtn = Viz.button(bar, "Show the withdrawn run", function (b) {
        ARM = ARM === "cak" ? "cakA1" : "cak";
        S = score();
        picked = null;
        b.textContent = ARM === "cak" ? "Show the withdrawn run" : "Back to the corrected run";
        b.setAttribute("aria-pressed", String(ARM !== "cak"));
        render();
      }, { pressed: false });

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

  window.EducationTestHooks = window.EducationTestHooks || {};
  window.EducationTestHooks.sweep = Object.freeze({
    schemaVersion: 1,
    semanticContract: Object.freeze({
      fractionMeaning: "fraction-of-water-saturation-supersaturation-ceiling",
      relativeHumidity: false,
      referenceMeaning: "registered-reference-expectation",
      cakModelInvalidRows: 0,
      cakA1ModelInvalidRows: 0,
      cakA1ProtocolInadmissibleRows: 204,
    }),
    temps: Object.freeze(TEMPS.slice()),
    fractions: Object.freeze(FRACTIONS.slice()),
    grids: Object.freeze({
      cak: Object.freeze(Object.assign({}, ARMS.cak.grid)),
      cakA1: Object.freeze(Object.assign({}, ARMS.cakA1.grid)),
    }),
    scoreArm: scoreArm,
  });

  window.Sweep = {
    mount: mount, score: score, ARMS: ARMS, TEMPS: TEMPS, FRACTIONS: FRACTIONS,
    scoreArm: scoreArm,
    setArm: function (a) { if (ARMS[a]) ARM = a; },
    getArm: function () { return ARM; },
  };
})();
