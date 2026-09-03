/*
 * Phase 6 historical/current status control.
 *
 * The two records are deliberately separate. Switching views never rewrites the
 * historical Arm 1 artifact and never turns a closure result into validation.
 */
(function () {
  "use strict";

  var RECORDS = {
    historical: {
      id: "historical",
      label: "Arm 1 report snapshot",
      authority: {
        artifact: "research/phase6-sweep-report.md",
        executionCommit: "390fe35",
        snapshotMeaning: "what the published Arm 1 report said when written"
      },
      arm1: {
        runState: "complete",
        points: "204/204",
        measuredHeadline: "3/90",
        evidenceClass: "measured result with verified provenance; not gate evidence",
        reportInventory: "report text says no independent verifier and six controls not executed"
      },
      arm2: {
        runState: "not present in this snapshot",
        measurement: "none"
      },
      closure: {
        flaglessCanonicalGate: "not run",
        independentReview: "not complete",
        crossPlatformArm64: "not run"
      }
    },
    current: {
      id: "current",
      label: "Final Phase 6 closure",
      authority: {
        stateDate: "2026-08-20 final closure",
        stateIndex: "docs/PROGRESS.md and completed Phase 6 plan",
        resultArtifact: "Phase 6 three-arm and numerical-ladder closure artifacts",
        snapshotMeaning: "Phase 6 complete on an accepted negative comparison; no validation"
      },
      arm1: {
        runState: "complete historical measurement",
        measuredHeadline: "3/90",
        model: "CAK broad-facet control",
        evidenceClass: "historical measured-only input to the final closure"
      },
      arm2: {
        runState: "complete historical measurement",
        measurement: "54/90 common scope; 54/78 arm-specific scope",
        model: "M1 in-sample bundled treatment",
        evidenceClass: "historical measured-only; CAK-to-M1 attribution remains confounded"
      },
      closure: {
        registeredReplacementGate: "complete-negative",
        noDipIntervention: "5/90",
        numericalAdequacy: "64 comparisons: 36 pass / 28 attached-count failures",
        closureVerifier: "gate6 passes 13/13 closure criteria",
        heldOutValidation: "not awarded; Phase 7 remains independently eligible and not started",
        crossPlatformControl: "historical control retained; not a Phase 6 closure result",
        phaseStatus: "complete on accepted negative finding; no validation"
      }
    }
  };

  var DEFAULT_VIEW = "current";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getRecord(view) {
    if (!Object.prototype.hasOwnProperty.call(RECORDS, view)) {
      throw new Error("unknown Phase 6 status view: " + view);
    }
    return RECORDS[view];
  }

  function addStyle() {
    if (document.getElementById("vcc-phase6-status-style")) return;
    var style = document.createElement("style");
    style.id = "vcc-phase6-status-style";
    style.textContent =
      ".p6s-stamp{font-family:var(--font-mono);font-size:.74rem;color:var(--ink-muted);margin:0 0 .7rem;overflow-wrap:anywhere}" +
      ".p6s-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem;min-width:0}" +
      ".p6s-card{border:1px solid var(--rule);border-radius:8px;padding:.75rem;background:var(--surface-1);min-width:0}" +
      ".p6s-card h3{font-size:.76rem;letter-spacing:.06em;text-transform:uppercase;margin:0 0 .5rem;color:var(--ink-muted)}" +
      ".p6s-card dl{display:grid;grid-template-columns:minmax(7rem,.7fr) minmax(10rem,1.3fr);gap:.35rem .65rem;margin:0;font-size:.78rem;line-height:1.45;min-width:0}" +
      ".p6s-card dt{font-weight:650;color:var(--ink-primary);min-width:0}.p6s-card dd{margin:0;color:var(--ink-secondary);min-width:0;overflow-wrap:anywhere}" +
      ".p6s-banner{margin:.75rem 0 0;border:1.5px solid var(--status-warning);border-radius:8px;padding:.65rem .75rem;color:var(--ink-secondary);font-size:var(--step--1);line-height:1.5}" +
      ".p6s-banner b{color:var(--ink-primary)}" +
      "@media(max-width:680px){.p6s-grid{grid-template-columns:1fr}.p6s-card dl{grid-template-columns:1fr}.p6s-card dd{margin-bottom:.35rem}}";
    document.head.appendChild(style);
  }

  function rowList(card, record) {
    var dl = document.createElement("dl");
    Object.keys(record).forEach(function (key) {
      var dt = document.createElement("dt");
      dt.textContent = key.replace(/([A-Z])/g, " $1").replace(/^./, function (c) { return c.toUpperCase(); });
      var dd = document.createElement("dd");
      dd.textContent = record[key];
      dl.appendChild(dt);
      dl.appendChild(dd);
    });
    card.appendChild(dl);
  }

  function card(title, record) {
    var section = document.createElement("section");
    section.className = "p6s-card";
    var h = document.createElement("h3");
    h.textContent = title;
    section.appendChild(h);
    rowList(section, record);
    return section;
  }

  function mount(root) {
    if (!root || root.getAttribute("data-phase6-status-mounted") === "true") return null;
    root.setAttribute("data-phase6-status-mounted", "true");
    addStyle();
    var body = root.querySelector(".anim__body");
    var controls = root.querySelector(".anim__controls");
    if (!body || !controls) return null;

    var view = DEFAULT_VIEW;
    var buttons = {};

    function render() {
      var record = getRecord(view);
      root.setAttribute("data-view", view);
      root.setAttribute("data-record-id", record.id);
      root.setAttribute("data-arm1-status", record.arm1.runState);
      root.setAttribute("data-arm2-status", record.arm2.runState);
      root.setAttribute("data-gate-status", record.closure.registeredReplacementGate || record.closure.flaglessCanonicalGate);
      root.setAttribute("data-review-status", record.closure.phaseStatus || record.closure.independentReview);
      root.setAttribute("data-cross-platform-status", record.closure.crossPlatformControl || record.closure.crossPlatformArm64);
      root.setAttribute("data-arm1-measured-headline", record.arm1.measuredHeadline);
      root.setAttribute("data-arm2-measurement", record.arm2.measurement || "none");

      Object.keys(buttons).forEach(function (id) {
        buttons[id].setAttribute("aria-pressed", String(id === view));
      });

      body.textContent = "";
      var stamp = document.createElement("p");
      stamp.className = "p6s-stamp";
      stamp.setAttribute("role", "status");
      stamp.setAttribute("aria-live", "polite");
      stamp.textContent = record.label + " · " + record.authority.snapshotMeaning;
      body.appendChild(stamp);

      var grid = document.createElement("div");
      grid.className = "p6s-grid";
      grid.appendChild(card("Arm 1 — measured control", record.arm1));
      grid.appendChild(card("Arm 2 — separate treatment", record.arm2));
      grid.appendChild(card(view === "historical" ? "Closure then owed" : "Final closure", record.closure));
      grid.appendChild(card("Provenance for this view", record.authority));
      body.appendChild(grid);

      var banner = document.createElement("p");
      banner.className = "p6s-banner";
      if (view === "historical") {
        banner.innerHTML = "<b>Historical wording, preserved:</b> this view explains why the report " +
          "says “six” and “no verifier.” It is not a claim about the repository now.";
      } else {
        banner.innerHTML = "<b>Final scope:</b> Phase 6 is complete-negative. CAK 3/90, M1 54/90 " +
          "on the common scope, no-dip 5/90, and the 36-pass/28-fail numerical ladder support a " +
          "closed negative record, not validation.";
      }
      body.appendChild(banner);
    }

    [
      ["historical", "Report snapshot"],
      ["current", "Current authority"]
    ].forEach(function (entry) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "button";
      button.textContent = entry[1];
      button.setAttribute("data-control", "phase6-status-view");
      button.setAttribute("data-view-id", entry[0]);
      button.addEventListener("click", function () {
        view = entry[0];
        render();
      });
      buttons[entry[0]] = button;
      controls.appendChild(button);
    });

    var reset = document.createElement("button");
    reset.type = "button";
    reset.className = "button";
    reset.textContent = "Reset to current";
    reset.setAttribute("data-control", "phase6-status-reset");
    reset.addEventListener("click", function () {
      view = DEFAULT_VIEW;
      render();
    });
    controls.appendChild(reset);

    var api = {
      select: function (id) {
        getRecord(id);
        view = id;
        render();
        return api.state();
      },
      reset: function () {
        view = DEFAULT_VIEW;
        render();
        return api.state();
      },
      state: function () {
        return { view: view, record: clone(getRecord(view)) };
      }
    };
    render();
    return api;
  }

  var root = document.querySelector("[data-demo='phase6-status-history']");
  var mounted = mount(root);
  window.__VCC_EDU_PHASE6_STATUS__ = {
    schemaVersion: 2,
    records: clone(RECORDS),
    mount: mount,
    select: function (id) {
      if (!mounted) throw new Error("Phase 6 status control is not mounted");
      return mounted.select(id);
    },
    reset: function () {
      if (!mounted) throw new Error("Phase 6 status control is not mounted");
      return mounted.reset();
    },
    state: function () {
      return mounted ? mounted.state() : null;
    }
  };
})();
