/* ============================================================================
   Part Two: keep the elliptic-solve diagnostics and interface-demand ledger
   separate.

   Authorities:
   - attachment-kinetics.md §4.4, components 3–4
   - ADR 0009, Decision 3–4
   - ADR 0013, Decision 2–4
   - solver-cpu/src/operator.ts

   The display uses integer micro-fill units for the interface ledger so its
   bookkeeping identity can be recomputed exactly in JavaScript. Those fill
   examples are teaching values, not measurements from a scientific run.
   ========================================================================== */

(function () {
  "use strict";

  function init() {
    const root = document.getElementById("anim-part2-ledger-separation");
    if (!root || !window.Viz || root.dataset.demoReady === "true") return;
    root.dataset.demoReady = "true";

    const body = root.querySelector(".anim__body");
    const controls = root.querySelector(".anim__controls");
    const head = root.querySelector(".anim__head");
    const SCALE = 1000000;
    const DIV_FLOOR = 1e-300;

    const scenarios = Object.freeze({
      "cold-fixed-point": Object.freeze({
        id: "cold-fixed-point",
        label: "Cold fixed point",
        note: "The numerical terms are the retained ADR 0013 checkpoint witness.",
        shellInjection: 3.679402302324622e-7,
        smootherDrift: -1.1395225041344048e-13,
        boundaryExchange: 3.679401162802118e-7,
        divTol: 1e-7,
        localExchangeSign: -1,
        placedFillUnits: 80000,
        saturationExcessUnits: 20000,
        kineticDemandUnits: 100000,
        holeFillDeficitUnits: 0,
      }),
      "clipped-demand": Object.freeze({
        id: "clipped-demand",
        label: "Saturating cell",
        note: "The interface example records the part of demand that cannot be placed.",
        shellInjection: 3.679402302324622e-7,
        smootherDrift: -1.1395225041344048e-13,
        boundaryExchange: 3.679401162802118e-7,
        divTol: 1e-7,
        localExchangeSign: -1,
        placedFillUnits: 65000,
        saturationExcessUnits: 35000,
        kineticDemandUnits: 100000,
        holeFillDeficitUnits: 0,
      }),
      "hole-fill-separate": Object.freeze({
        id: "hole-fill-separate",
        label: "Hole-fill event",
        note: "Geometric hole fill is reported beside, never inside, the kinetic identity.",
        shellInjection: 3.679402302324622e-7,
        smootherDrift: -1.1395225041344048e-13,
        boundaryExchange: 3.679401162802118e-7,
        divTol: 1e-7,
        localExchangeSign: -1,
        placedFillUnits: 100000,
        saturationExcessUnits: 0,
        kineticDemandUnits: 100000,
        holeFillDeficitUnits: 250000,
      }),
      "missing-excess": Object.freeze({
        id: "missing-excess",
        label: "Drop the excess",
        note: "Negative control: the numerical solve still closes while demand bookkeeping fails.",
        shellInjection: 3.679402302324622e-7,
        smootherDrift: -1.1395225041344048e-13,
        boundaryExchange: 3.679401162802118e-7,
        divTol: 1e-7,
        localExchangeSign: -1,
        placedFillUnits: 65000,
        saturationExcessUnits: 0,
        kineticDemandUnits: 100000,
        holeFillDeficitUnits: 0,
      }),
      "numerical-mismatch": Object.freeze({
        id: "numerical-mismatch",
        label: "Break the solve",
        note: "Negative control: demand bookkeeping closes while the numerical identity fails.",
        shellInjection: 4e-6,
        smootherDrift: 0,
        boundaryExchange: 3e-6,
        divTol: 1e-7,
        localExchangeSign: -1,
        placedFillUnits: 80000,
        saturationExcessUnits: 20000,
        kineticDemandUnits: 100000,
        holeFillDeficitUnits: 0,
      }),
    });

    const scenarioIds = Object.freeze(Object.keys(scenarios));
    let scenarioId = "cold-fixed-point";
    let crossLedgerAttempted = false;
    const buttons = {};

    const status = document.createElement("p");
    status.className = "anim__sub";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.style.fontWeight = "650";
    head.appendChild(status);

    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(auto-fit, minmax(min(100%, 17rem), 1fr))";
    grid.style.gap = "1rem";
    body.appendChild(grid);

    const fence = document.createElement("div");
    fence.setAttribute("role", "note");
    fence.style.marginTop = "1rem";
    fence.style.padding = "0.85rem 1rem";
    fence.style.border = "1px solid var(--rule-strong)";
    fence.style.borderRadius = "10px";
    body.appendChild(fence);

    function formatScientific(value) {
      return value === 0 ? "0" : value.toExponential(6);
    }

    function formatFill(units) {
      return (units / SCALE).toFixed(6);
    }

    function numericalResult(row) {
      const numerator = row.shellInjection + row.smootherDrift - row.boundaryExchange;
      return {
        numerator,
        residual: Math.abs(numerator) /
          Math.max(Math.abs(row.boundaryExchange), DIV_FLOOR),
      };
    }

    function demandResult(row) {
      return {
        closureUnits:
          row.placedFillUnits + row.saturationExcessUnits - row.kineticDemandUnits,
      };
    }

    function addTerm(list, name, value, explanation) {
      const term = document.createElement("div");
      term.style.display = "grid";
      term.style.gridTemplateColumns = "minmax(0, 1fr) minmax(0, 1fr)";
      term.style.gap = "0.35rem 0.75rem";
      term.style.padding = "0.42rem 0";
      term.style.borderBottom = "1px solid var(--rule)";

      const label = document.createElement("span");
      label.textContent = name;
      label.style.fontWeight = "650";
      const number = document.createElement("code");
      number.textContent = value;
      number.style.textAlign = "right";
      number.style.justifySelf = "end";
      number.style.minWidth = "0";
      number.style.maxWidth = "100%";
      number.style.whiteSpace = "normal";
      number.style.overflowWrap = "anywhere";
      const note = document.createElement("small");
      note.textContent = explanation;
      note.style.color = "var(--ink-muted)";
      note.style.gridColumn = "1 / -1";

      term.appendChild(label);
      term.appendChild(number);
      term.appendChild(note);
      list.appendChild(term);
    }

    function panel(title, eyebrow, formula) {
      const card = document.createElement("section");
      card.style.minWidth = "0";
      card.style.padding = "1rem";
      card.style.border = "1px solid var(--rule)";
      card.style.borderRadius = "12px";
      card.style.background = "var(--surface-1)";

      const over = document.createElement("p");
      over.textContent = eyebrow;
      over.style.margin = "0 0 0.2rem";
      over.style.color = "var(--ink-muted)";
      over.style.fontSize = "0.72rem";
      over.style.fontWeight = "700";
      over.style.letterSpacing = "0.06em";

      const heading = document.createElement("h3");
      heading.textContent = title;
      heading.style.margin = "0 0 0.6rem";
      heading.style.fontSize = "1rem";

      const equation = document.createElement("code");
      equation.textContent = formula;
      equation.style.display = "block";
      equation.style.whiteSpace = "normal";
      equation.style.overflowWrap = "anywhere";
      equation.style.padding = "0.65rem";
      equation.style.borderRadius = "8px";
      equation.style.background = "var(--surface-sunken)";

      const list = document.createElement("div");
      list.style.marginTop = "0.65rem";

      card.appendChild(over);
      card.appendChild(heading);
      card.appendChild(equation);
      card.appendChild(list);
      grid.appendChild(card);
      return { card, list };
    }

    function verdict(card, ok, text) {
      const c = Viz.colors();
      const result = document.createElement("p");
      result.style.margin = "0.8rem 0 0";
      result.style.fontWeight = "750";
      result.style.color = ok ? c.good : c.critical;
      result.textContent = (ok ? "CLOSES — " : "FAILS — ") + text;
      card.appendChild(result);
    }

    function syncButtons() {
      scenarioIds.forEach(function (id) {
        buttons[id].setAttribute("aria-pressed", String(id === scenarioId));
      });
    }

    function publishRawTerms(row) {
      root.dataset.demoSchema = "part2-ledger-separation-v1";
      root.dataset.scenarioId = row.id;
      root.dataset.shellInjection = String(row.shellInjection);
      root.dataset.smootherDrift = String(row.smootherDrift);
      root.dataset.boundaryExchange = String(row.boundaryExchange);
      root.dataset.divTol = String(row.divTol);
      root.dataset.localExchangeSign = String(row.localExchangeSign);
      root.dataset.placedFillUnits = String(row.placedFillUnits);
      root.dataset.saturationExcessUnits = String(row.saturationExcessUnits);
      root.dataset.kineticDemandUnits = String(row.kineticDemandUnits);
      root.dataset.holeFillDeficitUnits = String(row.holeFillDeficitUnits);
      root.dataset.fillUnitScale = String(SCALE);
      root.dataset.divergenceFloor = String(DIV_FLOOR);
      root.dataset.crossLedgerPolicy = "forbidden";
      root.dataset.crossLedgerAttempted = String(crossLedgerAttempted);
    }

    function render() {
      const row = scenarios[scenarioId];
      const numerical = numericalResult(row);
      const demand = demandResult(row);
      const numericalOk = numerical.residual < row.divTol;
      const demandOk = demand.closureUnits === 0;
      grid.textContent = "";

      const numericalPanel = panel(
        "Elliptic-solve diagnostics",
        "ONE RELAXATION SWEEP · NUMERICAL POTENTIAL",
        "|shell injection + smoother drift − signed boundary exchange| / |boundary exchange|",
      );
      addTerm(
        numericalPanel.list,
        "shell clamp",
        formatScientific(row.shellInjection),
        "Signed field change imposed at the outer numerical shell; no physical duration.",
      );
      addTerm(
        numericalPanel.list,
        "smoother drift",
        formatScientific(row.smootherDrift),
        "Directly metered float64 field change; zero in exact arithmetic.",
      );
      addTerm(
        numericalPanel.list,
        "boundary exchange",
        formatScientific(row.boundaryExchange),
        "Signed boundary-value replacement, not deposited ice or uptake.",
      );
      addTerm(
        numericalPanel.list,
        "local sign witness",
        row.localExchangeSign < 0 ? "negative" : "nonnegative",
        "An individual replacement may be negative while kinetic demand stays nonnegative.",
      );
      addTerm(
        numericalPanel.list,
        "numerator",
        formatScientific(numerical.numerator),
        "These three numerical terms close only this sweep's discrete divergence identity.",
      );
      addTerm(
        numericalPanel.list,
        "divergence residual",
        formatScientific(numerical.residual),
        "Must be below divTol = " + formatScientific(row.divTol) + ".",
      );
      verdict(
        numericalPanel.card,
        numericalOk,
        numericalOk ? "the numerical solve balances" : "the numerical solve does not balance",
      );

      const demandPanel = panel(
        "Interface-demand bookkeeping",
        "ONE PHYSICAL INTERFACE STEP · FILL FRACTION",
        "placed fill + unapplied saturation excess = computed HK kinetic demand",
      );
      addTerm(
        demandPanel.list,
        "placed fill",
        formatFill(row.placedFillUnits),
        "The part that enters the fill field and can advance ice.",
      );
      addTerm(
        demandPanel.list,
        "unapplied excess",
        formatFill(row.saturationExcessUnits),
        "Recorded demand beyond saturation; not fill, ice, or physical uptake.",
      );
      addTerm(
        demandPanel.list,
        "computed kinetic demand",
        formatFill(row.kineticDemandUnits),
        "Geometry-adjusted per-boundary-pixel Hertz–Knudsen demand.",
      );
      addTerm(
        demandPanel.list,
        "integer closure",
        String(demand.closureUnits) + " micro-fill units",
        "Computed exactly from the three raw integer terms above.",
      );
      addTerm(
        demandPanel.list,
        "hole-fill deficit",
        formatFill(row.holeFillDeficitUnits),
        "Geometric attachment without kinetic supply; reported separately, never netted.",
      );
      verdict(
        demandPanel.card,
        demandOk,
        demandOk ? "demand is fully accounted for" : "computed demand is missing from the record",
      );

      fence.style.borderColor = crossLedgerAttempted
        ? "var(--status-critical)"
        : "var(--rule-strong)";
      fence.innerHTML = crossLedgerAttempted
        ? "<strong>REFUSED:</strong> a term from one card cannot cancel a failure in the other. " +
          "Shell clamp, smoother drift and signed boundary exchange belong to an elliptic sweep " +
          "with no physical duration. Placed fill, unapplied excess and kinetic demand belong to " +
          "the interface step where physical time advances."
        : "<strong>Ledger firewall:</strong> neither card supplies a term to the other. " +
          "A passing divergence identity does not repair missing kinetic demand, and a closed " +
          "demand ledger does not make an unconverged field acceptable.";

      status.textContent =
        row.label + ". Numerical residual " + formatScientific(numerical.residual) +
        (numericalOk ? " closes" : " fails") + "; interface closure " +
        String(demand.closureUnits) + " micro-fill units " +
        (demandOk ? "closes." : "fails.") + " " + row.note;

      publishRawTerms(row);
      syncButtons();
    }

    scenarioIds.forEach(function (id) {
      const button = Viz.button(controls, scenarios[id].label, function () {
        scenarioId = id;
        crossLedgerAttempted = false;
        crossButton.setAttribute("aria-pressed", "false");
        render();
      }, { pressed: id === scenarioId });
      button.dataset.control = "ledger-scenario-" + id;
      button.dataset.scenarioId = id;
      buttons[id] = button;
    });

    const crossButton = Viz.button(controls, "Try a cross-ledger cancellation", function () {
      crossLedgerAttempted = !crossLedgerAttempted;
      crossButton.setAttribute("aria-pressed", String(crossLedgerAttempted));
      render();
    }, { pressed: false });
    crossButton.dataset.control = "ledger-cross-cancel";

    window.EducationTestHooks = window.EducationTestHooks || {};
    window.EducationTestHooks.part2LedgerSeparation = Object.freeze({
      schema: "part2-ledger-separation-v1",
      fillUnitScale: SCALE,
      divergenceFloor: DIV_FLOOR,
      scenarioIds,
      getRawScenario: function (id) {
        const row = scenarios[id];
        return row ? Object.assign({}, row) : null;
      },
    });

    render();
    Viz.onThemeChange(render);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
