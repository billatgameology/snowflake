/* ============================================================================
   Part Two: transferability is a configuration comparison, not a vibe.

   The target is the configuration a domain-convergence study would have to
   govern for the registered no-SDAK Phase 6 sweep. The historical ladder in
   research/phase6-convergence.md §1.2 used CAK_A1, ran before the registered
   Phase 6 freeze, and did not record its Node/V8 identity. ADR 0031 registers
   CAK. Rule 11 therefore prevents that ladder from certifying the CAK domain
   decision even though its geometric and numerical settings otherwise match.
   ========================================================================== */

(function () {
  "use strict";

  function init() {
    const root = document.getElementById("anim-part2-transferability");
    if (!root || !window.Viz || root.dataset.demoReady === "true") return;
    root.dataset.demoReady = "true";

    const body = root.querySelector(".anim__body");
    const controls = root.querySelector(".anim__controls");
    const head = root.querySelector(".anim__head");

    const axes = Object.freeze([
      Object.freeze({ key: "claim", label: "claim · requested inference" }),
      Object.freeze({ key: "modelArm", label: "physics · model arm" }),
      Object.freeze({ key: "paramSet", label: "physics · parameter set" }),
      Object.freeze({ key: "temperatureCases", label: "cases · temperatures" }),
      Object.freeze({ key: "sigmaCases", label: "cases · far-field supersaturations" }),
      Object.freeze({ key: "waterFraction", label: "cases · water-relative fraction" }),
      Object.freeze({ key: "farField", label: "boundary · far field" }),
      Object.freeze({ key: "surfacePolicy", label: "surface · coupled policy" }),
      Object.freeze({ key: "domainShape", label: "domain · shape" }),
      Object.freeze({ key: "domainStudy", label: "domain · ladder" }),
      Object.freeze({ key: "registeredDomain", label: "domain · budget being supported" }),
      Object.freeze({ key: "dxUm", label: "grid · spacing" }),
      Object.freeze({ key: "measurementExtent", label: "measurement · extent" }),
      Object.freeze({ key: "stopValidity", label: "measurement · valid stop" }),
      Object.freeze({ key: "domainContactGuard", label: "measurement · contact guard" }),
      Object.freeze({ key: "cflFill", label: "numerics · fill-CFL" }),
      Object.freeze({ key: "pressurePa", label: "physics · pressure" }),
      Object.freeze({ key: "latentHeating", label: "physics · latent heating" }),
      Object.freeze({ key: "timelineSchedule", label: "environment · within-run history" }),
      Object.freeze({ key: "noiseEpsilon", label: "stochastic · noise amplitude" }),
      Object.freeze({ key: "rngSeed", label: "stochastic · RNG seed" }),
      Object.freeze({ key: "seedShape", label: "initial state · seed shape" }),
      Object.freeze({ key: "seedRadius", label: "initial state · seed radius" }),
      Object.freeze({ key: "seedThickness", label: "initial state · seed thickness" }),
      Object.freeze({ key: "seedSites", label: "initial state · seeded sites" }),
      Object.freeze({ key: "seedEnsemble", label: "statistics · seed ensemble" }),
      Object.freeze({ key: "relaxTol", label: "numerics · iterate tolerance and norm" }),
      Object.freeze({ key: "divTol", label: "numerics · divergence tolerance and norm" }),
      Object.freeze({ key: "relaxMaxSweeps", label: "numerics · relaxation cap" }),
      Object.freeze({ key: "stepCap", label: "execution · interface-step safety cap" }),
      Object.freeze({ key: "habitMetric", label: "claim · habit metric" }),
      Object.freeze({ key: "codeVersion", label: "provenance · executed code" }),
      Object.freeze({ key: "engine", label: "execution · engine / arithmetic" }),
      Object.freeze({ key: "runtimeIdentity", label: "provenance · Node/V8 identity" }),
      Object.freeze({ key: "hostScope", label: "execution · portability scope" }),
      Object.freeze({ key: "workload", label: "execution · study workload" }),
    ]);

    const target = Object.freeze({
      claim: "domain convergence for the registered no-SDAK Phase 6 habit-class sweep",
      modelArm: "no SDAK",
      paramSet: "CAK",
      temperatureCases: "warm -5 °C; cold -15 °C",
      sigmaCases: "warm 0.007500; cold 0.023550",
      waterFraction: "f=0.15 of Table 2.1 water saturation at each temperature",
      farField: "monopole-matched",
      surfacePolicy: "aggregate-hv-g1h1-v6",
      domainShape: "centred hexPrism active domain in a cubic N×N×N lattice",
      domainStudy: "N=40,48,56,64,80",
      registeredDomain: "N=48 (48×48×48)",
      dxUm: "0.35 µm",
      measurementExtent: "largestExtent=max(tExtent,zExtent)=21 (7.35 µm)",
      stopValidity: "size-target; final largestExtent >=21; every other stop reason is invalid",
      domainContactGuard: "exclude largestExtent/N >0.65; collision guard only",
      cflFill: "0.1",
      pressurePa: "101325 Pa (1 atm)",
      latentHeating: "not applied; carried as a stated systematic",
      timelineSchedule: "none; temperature and sigmaInfinity stay constant within each run; no events or ramps",
      noiseEpsilon: "0 (off)",
      rngSeed: "1 (pinned although noise is off)",
      seedShape: "centred canonical hexagonal plate",
      seedRadius: "2 lattice cells (0.7 µm at registered dx)",
      seedThickness: "1 layer",
      seedSites: "19",
      seedEnsemble: "1 deterministic run per (temperature, supersaturation, N)",
      relaxTol: "1e-9 relative max-norm of successive-iterate change / sigmaInfinity",
      divTol: "1e-7 relative |injection + smoother drift - surface exchange| / |surface exchange|",
      relaxMaxSweeps: "200000 (refusal cap)",
      stepCap: "100000 (safety cap; a valid run must stop earlier on size-target)",
      habitMetric: "AR=zExtent/tExtent; plate <=1/1.5; column >=1.5; otherwise neutral",
      codeVersion: "record execution commit; require Phase 6 freeze e2f1bfc as its ancestor",
      engine: "CPU float64 oracle",
      runtimeIdentity: "recorded per run: Node v24.13.1; V8 13.6.233.17-node.40",
      hostScope: "registered win32 x64 host; cross-platform reproducibility not established",
      workload: "2 cases × 5 domain sizes = 10 runs; grow each to size-target extent 21",
    });

    const sourceAuthority = Object.freeze({
      revision: "8c781b166db2c72d2fa86cef001e2e8c48ac96c3",
      blobs: Object.freeze({
        "research/phase6-convergence.md": "a509b0d5111368c01281a9d0b359fb89ae6bc03c",
        "runner/src/phase6-protocol.ts": "6d1e1b7a390b0b6b4de4d722e1d6e64306f7d8d2",
        "runner/src/phase6-crossplatform.ts": "2840d4c287503e9cf24ab543b83afb5274a1daf4",
        "runner/src/phase6-sweep.ts": "5cb0cfa48380695fdc6ffcbd91a08d9516b41861",
        "runner/src/grow-lk-defaults.ts": "51844d02d3c9e7d59be2156cc2a3ddc6160eba4c",
        "runner/test/phase6-protocol.test.ts": "84b3d879bac37fd5ecf59f3269bc28ee43481baa",
        "runner/test/phase6-sweep.test.ts": "4a5e93c1de898a08dc24690fb76e7391f457504d",
      }),
    });

    const rows = Object.freeze([
      Object.freeze({
        id: "required-shape",
        label: "Exact-config study shape",
        evidenceStatus: "requirement example, not executed evidence",
        source: "AGENTS.md Rule 11",
        config: Object.freeze(Object.assign({}, target)),
      }),
      Object.freeze({
        id: "cak-a1-domain",
        label: "Historical extent-21 domain ladder",
        evidenceStatus: "measured under superseded inputs; execution revision and runtime were not recorded",
        source: "research/phase6-convergence.md §§opening, 1.2, 5 (result recorded at 675288f); ADR 0031",
        config: Object.freeze({
          claim: "domain convergence for the registered no-SDAK Phase 6 habit-class sweep",
          modelArm: "no SDAK",
          paramSet: "CAK_A1",
          temperatureCases: "warm -5 °C; cold -15 °C",
          sigmaCases: "warm 0.007500; cold 0.023550",
          waterFraction: "f=0.15 of Table 2.1 water saturation at each temperature",
          farField: "monopole-matched",
          surfacePolicy: "aggregate-hv-g1h1-v6",
          domainShape: "centred hexPrism active domain in a cubic N×N×N lattice",
          domainStudy: "N=40,48,56,64,80",
          registeredDomain: "N=48 (48×48×48)",
          dxUm: "0.35 µm",
          measurementExtent: "largestExtent=max(tExtent,zExtent)=21 (7.35 µm)",
          stopValidity: "size-target; final largestExtent >=21; every other stop reason is invalid",
          domainContactGuard: "exclude largestExtent/N >0.65; collision guard only",
          cflFill: "0.1",
          pressurePa: "not recorded by cited evidence (pressure unknown)",
          latentHeating: "not recorded by cited evidence",
          timelineSchedule: "not recorded by cited evidence (within-run history unknown)",
          noiseEpsilon: "0 (off)",
          rngSeed: "not recorded by cited evidence (noise is off)",
          seedShape: "centred canonical hexagonal plate",
          seedRadius: "2 lattice cells (0.7 µm at registered dx)",
          seedThickness: "1 layer",
          seedSites: "19",
          seedEnsemble: "1 deterministic run per (temperature, supersaturation, N)",
          relaxTol: "1e-9 relative max-norm of successive-iterate change / sigmaInfinity",
          divTol: "1e-7 relative |injection + smoother drift - surface exchange| / |surface exchange|",
          relaxMaxSweeps: "not recorded by cited evidence",
          stepCap: "not recorded by cited evidence",
          habitMetric: "AR=zExtent/tExtent; plate <=1/1.5; column >=1.5; otherwise neutral",
          codeVersion: "results recorded at 675288f; execution commit not recorded; freeze ancestry unverified",
          engine: "not recorded by cited evidence (arithmetic/runtime unknown)",
          runtimeIdentity: "not recorded by cited evidence (Node/V8 unknown)",
          hostScope: "registered win32 x64 host; cross-platform reproducibility not established",
          workload: "2 cases × 5 domain sizes = 10 runs; grow each to size-target extent 21",
        }),
      }),
      Object.freeze({
        id: "extent-15-domain",
        label: "Earlier convenient-size ladder",
        evidenceStatus: "superseded and off measurement size",
        source: "research/phase6-convergence.md §1.1",
        config: Object.freeze({
          claim: "domain convergence at a convenient, later-superseded measurement size",
          modelArm: "no SDAK",
          paramSet: "CAK_A1",
          temperatureCases: "warm -5 °C; cold -15 °C",
          sigmaCases: "warm 0.007500; cold 0.023550",
          waterFraction: "f=0.15 of Table 2.1 water saturation at each temperature",
          farField: "monopole-matched",
          surfacePolicy: "aggregate-hv-g1h1-v6",
          domainShape: "centred hexPrism active domain in a cubic N×N×N lattice",
          domainStudy: "N=28,32,40,48,64",
          registeredDomain: "no budget result at the target configuration",
          dxUm: "0.35 µm",
          measurementExtent: "largestExtent=max(tExtent,zExtent)=15 (5.25 µm)",
          stopValidity: "size-target at largestExtent >=15; not the registered measurement size",
          domainContactGuard: "exclude largestExtent/N >0.65; collision guard only",
          cflFill: "not recorded by cited evidence",
          pressurePa: "not recorded by cited evidence (pressure unknown)",
          latentHeating: "not recorded by cited evidence",
          timelineSchedule: "not recorded by cited evidence (within-run history unknown)",
          noiseEpsilon: "0 (off)",
          rngSeed: "not recorded by cited evidence (noise is off)",
          seedShape: "centred canonical hexagonal plate",
          seedRadius: "2 lattice cells (0.7 µm at registered dx)",
          seedThickness: "1 layer",
          seedSites: "19",
          seedEnsemble: "1 deterministic run per (temperature, supersaturation, N)",
          relaxTol: "1e-9 relative max-norm of successive-iterate change / sigmaInfinity",
          divTol: "1e-7 relative |injection + smoother drift - surface exchange| / |surface exchange|",
          relaxMaxSweeps: "not recorded by cited evidence",
          stepCap: "not recorded by cited evidence",
          habitMetric: "AR=zExtent/tExtent; plate <=1/1.5; column >=1.5; otherwise neutral",
          codeVersion: "execution commit not recorded in cited extent-15 study; freeze ancestry unverified",
          engine: "not recorded by cited evidence (arithmetic/runtime unknown)",
          runtimeIdentity: "not recorded by cited evidence (Node/V8 unknown)",
          hostScope: "registered win32 x64 host; cross-platform reproducibility not established",
          workload: "2 cases × 5 domain sizes = 10 runs; grow each to size-target extent 15",
        }),
      }),
      Object.freeze({
        id: "dirichlet-calibration",
        label: "Fixed-value-wall calibration",
        evidenceStatus: "different boundary experiment",
        source: "ADR 0024; solver-cpu/test/monopole-far-field.test.ts at 8c781b1",
        config: Object.freeze({
          claim: "far-field domain-dependence A/B after a fixed step count",
          modelArm: "no SDAK",
          paramSet: "CAK_A1",
          temperatureCases: "warm -5 °C only",
          sigmaCases: "0.007500 only",
          waterFraction: "not recorded by cited evidence; raw sigmaInfinity=0.007500",
          farField: "dirichlet versus monopole-matched A/B",
          surfacePolicy: "aggregate-hv-g1h1-v6",
          domainShape: "centred hexPrism active domain in a cubic N×N×N lattice",
          domainStudy: "N=28,40",
          registeredDomain: "no registered sweep-domain budget",
          dxUm: "0.35 µm",
          measurementExtent: "not size-controlled; sampled after 60 interface steps",
          stopValidity: "completed-interface-step cap at 60; not size-target",
          domainContactGuard: "not the registered size-target/contact experiment",
          cflFill: "0.1",
          pressurePa: "101325 Pa (1 atm)",
          latentHeating: "not represented in cited fixture",
          timelineSchedule: "none; temperature and sigmaInfinity stay constant within each run; no events or ramps",
          noiseEpsilon: "0 (off)",
          rngSeed: "1 (pinned although noise is off)",
          seedShape: "centred canonical hexagonal plate",
          seedRadius: "2 lattice cells (0.7 µm at registered dx)",
          seedThickness: "1 layer",
          seedSites: "19",
          seedEnsemble: "1 deterministic run per (far field, N)",
          relaxTol: "1e-8 relative max-norm of successive-iterate change / sigmaInfinity",
          divTol: "1e-6 relative divergence identity",
          relaxMaxSweeps: "200000 (refusal cap)",
          stepCap: "60 completed interface steps",
          habitMetric: "attached count and AR after 60 steps; not the registered habit measurement",
          codeVersion: "test source at main@8c781b1; no evidence execution commit recorded",
          engine: "CPU float64 oracle",
          runtimeIdentity: "not recorded for cited test execution (Node/V8 unknown)",
          hostScope: "host/runtime not pinned by the cited test result",
          workload: "2 far fields × 2 domain sizes × 60 interface steps = 4 runs",
        }),
      }),
      Object.freeze({
        id: "gpu-four-step",
        label: "Phase 5 GPU fixture",
        evidenceStatus: "certified only for its four-step fixture",
        source: "runner/src/phase5-protocol.ts; Phase 6 plan",
        config: Object.freeze({
          claim: "Phase 5 CPU/GPU conformance for one four-step fixture",
          modelArm: "no SDAK",
          paramSet: "CAK_A1",
          temperatureCases: "warm -5 °C only",
          sigmaCases: "0.002000 only",
          waterFraction: "not a registered Table 2.1 fraction",
          farField: "dirichlet",
          surfacePolicy: "aggregate-hv-g1h1-v5",
          domainShape: "hexPrism active domain in a 24×24×18 lattice",
          domainStudy: "24×24×18 single fixture",
          registeredDomain: "no Phase 6 domain budget",
          dxUm: "0.35 µm",
          measurementExtent: "not measured",
          stopValidity: "completed-interface-step cap at 4; not size-target",
          domainContactGuard: "not the registered Phase 6 contact experiment",
          cflFill: "0.1",
          pressurePa: "101325 Pa (1 atm)",
          latentHeating: "not represented in cited fixture",
          timelineSchedule: "none; temperature and sigmaInfinity stay constant within each run; no events or ramps",
          noiseEpsilon: "0 (off)",
          rngSeed: "1 (pinned although noise is off)",
          seedShape: "centred canonical hexagonal plate",
          seedRadius: "2 lattice cells (0.7 µm at registered dx)",
          seedThickness: "1 layer",
          seedSites: "19",
          seedEnsemble: "1 deterministic fixture run per engine",
          relaxTol: "1e-9 relative max-norm of successive-iterate change / sigmaInfinity",
          divTol: "1e-7 relative |injection + smoother drift - surface exchange| / |surface exchange|",
          relaxMaxSweeps: "200000 (refusal cap)",
          stepCap: "4 completed interface steps",
          habitMetric: "CPU/GPU conformance observables; not a domain-habit measurement",
          codeVersion: "Phase 5 evidence revision; not the Phase 6 freeze/execution identity",
          engine: "GPU float32 against CPU float64",
          runtimeIdentity: "Playwright 1.61.1 / Chromium 1228; not the Phase 6 Node/V8 identity",
          hostScope: "Phase 5 Windows D3D12 fixture scope",
          workload: "one 24×24×18 fixture for 4 interface steps",
        }),
      }),
    ]);

    let selectedId = "cak-a1-domain";
    const buttons = {};

    const status = document.createElement("p");
    status.className = "anim__sub";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.style.fontWeight = "650";
    head.appendChild(status);

    const summary = document.createElement("div");
    summary.className = "transfer-summary";
    summary.style.marginBottom = "0.9rem";
    summary.style.padding = "0.8rem 1rem";
    summary.style.border = "1px solid var(--rule-strong)";
    summary.style.borderRadius = "10px";
    body.appendChild(summary);

    const scrollCue = document.createElement("p");
    scrollCue.className = "table-scroll-cue";
    scrollCue.textContent =
      "On a narrow screen, swipe the table sideways to compare the selected evidence column.";
    scrollCue.style.margin = "0 0 0.45rem";
    scrollCue.style.fontSize = "var(--step--1)";
    scrollCue.style.color = "var(--ink-muted)";
    body.appendChild(scrollCue);

    const authorityNote = document.createElement("p");
    authorityNote.className = "transfer-authority";
    authorityNote.textContent =
      axes.length + " governing fields, pinned to the source snapshot main@8c781b1. " +
      "The source revision authenticates the contract; it is not itself evidence that a study ran.";
    authorityNote.style.margin = "0 0 0.65rem";
    authorityNote.style.fontSize = "var(--step--1)";
    authorityNote.style.color = "var(--ink-muted)";
    body.appendChild(authorityNote);

    const tableWrap = document.createElement("div");
    tableWrap.className = "table-wrap";
    tableWrap.tabIndex = 0;
    tableWrap.setAttribute("role", "region");
    tableWrap.setAttribute(
      "aria-label",
      "Scrollable comparison of the target configuration with the selected evidence",
    );
    const table = document.createElement("table");
    const caption = document.createElement("caption");
    caption.textContent =
      "All " + axes.length + " governing fields are compared value by value. A mismatch is not " +
      "averaged away by matches elsewhere; an exact match still needs executed evidence.";
    const thead = document.createElement("thead");
    const header = document.createElement("tr");
    ["Axis", "Target configuration", "Selected evidence"].forEach(function (text) {
      const th = document.createElement("th");
      th.textContent = text;
      header.appendChild(th);
    });
    thead.appendChild(header);
    const tbody = document.createElement("tbody");
    table.appendChild(caption);
    table.appendChild(thead);
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    body.appendChild(tableWrap);

    function selectedRow() {
      return rows.find(function (row) { return row.id === selectedId; });
    }

    function mismatches(row) {
      return axes.filter(function (axis) {
        return row.config[axis.key] !== target[axis.key];
      }).map(function (axis) { return axis.key; });
    }

    function syncButtons() {
      rows.forEach(function (row) {
        buttons[row.id].setAttribute("aria-pressed", String(row.id === selectedId));
      });
    }

    function render() {
      const row = selectedRow();
      const different = mismatches(row);
      const c = Viz.colors();
      tbody.textContent = "";

      axes.forEach(function (axis) {
        const tr = document.createElement("tr");
        tr.dataset.configKey = axis.key;
        tr.dataset.targetValue = target[axis.key];
        tr.dataset.evidenceValue = row.config[axis.key];

        const label = document.createElement("th");
        label.scope = "row";
        label.textContent = axis.label;
        const targetCell = document.createElement("td");
        targetCell.textContent = target[axis.key];
        const evidenceCell = document.createElement("td");
        evidenceCell.textContent = row.config[axis.key];
        const same = target[axis.key] === row.config[axis.key];
        tr.dataset.configMatch = String(same);
        evidenceCell.style.color = same ? c.good : c.critical;
        evidenceCell.style.fontWeight = same ? "500" : "750";
        evidenceCell.setAttribute("data-config-match", String(same));

        tr.appendChild(label);
        tr.appendChild(targetCell);
        tr.appendChild(evidenceCell);
        tbody.appendChild(tr);
      });

      const exact = different.length === 0;
      summary.style.borderColor = exact ? c.good : c.critical;
      summary.innerHTML = exact
        ? "<strong style=\"color:" + c.good + "\">Configuration match.</strong> This row has " +
          "the shape Rule 11 requires, but it is explicitly only a requirement example: matching " +
          "is necessary, not a substitute for executing, authenticating and reviewing evidence."
        : "<strong style=\"color:" + c.critical + "\">NON-TRANSFERABLE.</strong> Mismatched " +
          "axis" + (different.length === 1 ? "" : "es") + ": <code>" +
          different.join("</code>, <code>") + "</code>. A match on the remaining axes cannot " +
          "cancel any one of these differences.";

      status.textContent =
        row.label + " — " + row.evidenceStatus + ". " +
        (exact
          ? "All configuration fields match; evidence has not been supplied by this example."
          : different.length + " configuration mismatch" +
            (different.length === 1 ? "" : "es") + "; the claim does not transfer.") +
        " Source: " + row.source + ".";

      root.dataset.demoSchema = "part2-transferability-v1";
      root.dataset.selectedEvidenceId = row.id;
      root.dataset.targetConfig = JSON.stringify(target);
      root.dataset.selectedConfig = JSON.stringify(row.config);
      root.dataset.selectedSource = row.source;
      root.dataset.selectedEvidenceStatus = row.evidenceStatus;
      root.dataset.sourceAuthority = JSON.stringify(sourceAuthority);
      syncButtons();
    }

    rows.forEach(function (row) {
      const button = Viz.button(controls, row.label, function () {
        selectedId = row.id;
        render();
      }, { pressed: row.id === selectedId });
      button.dataset.control = "transfer-row-" + row.id;
      button.dataset.evidenceId = row.id;
      buttons[row.id] = button;
    });

    window.EducationTestHooks = window.EducationTestHooks || {};
    window.EducationTestHooks.part2Transferability = Object.freeze({
      schema: "part2-transferability-v1",
      axes,
      getTargetConfig: function () { return Object.assign({}, target); },
      getSourceAuthority: function () {
        return JSON.parse(JSON.stringify(sourceAuthority));
      },
      evidenceIds: Object.freeze(rows.map(function (row) { return row.id; })),
      getRawEvidence: function (id) {
        const row = rows.find(function (candidate) { return candidate.id === id; });
        return row
          ? {
              id: row.id,
              label: row.label,
              evidenceStatus: row.evidenceStatus,
              source: row.source,
              config: Object.assign({}, row.config),
            }
          : null;
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
