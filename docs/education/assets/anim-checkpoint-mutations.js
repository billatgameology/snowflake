/*
 * Fail-closed checkpoint mutation explorer.
 *
 * This is a teaching reconstruction of the checks in core/src/checkpoint.ts,
 * core/test/checkpoint.test.ts, and the gate checkpoint validators. It does not
 * parse an uploaded checkpoint and it does not authenticate evidence.
 */
(function () {
  "use strict";

  var CASES = [
    {
      id: "clean-lk-v2",
      label: "Unchanged LK v2 control",
      checkpointKind: "LibbrechtKinetics v2",
      mutation: {
        target: "none",
        operation: "leave the encoded bytes unchanged",
        before: "registered LK v2 checkpoint",
        after: "same bytes"
      },
      requiredFields: [
        "magic=VCCCKPT1",
        "version=2",
        "endianness=LE",
        "recognized surfacePolicy",
        "exact a/f/sigma field table",
        "exact payload length",
        "valid state semantics",
        "metadata equals the registered run"
      ],
      observations: [
        { stage: "framing", requirement: "magic and declared header length", observed: "VCCCKPT1; complete header", disposition: "accept" },
        { stage: "header", requirement: "strict LK v2 controls", observed: "all required controls present and recognized", disposition: "accept" },
        { stage: "fields", requirement: "a:u8, f:f64, sigma:f64; each length = cell count", observed: "exact table and exact payload size", disposition: "accept" },
        { stage: "state", requirement: "binary attachment, fill in [0,1], sigma >= -1, ice/wall invariants", observed: "all invariants hold", disposition: "accept" },
        { stage: "evidence-context", requirement: "registered metadata, field bits, byte-stable re-encode, reconstructible solver", observed: "all match the named run", disposition: "accept" }
      ],
      note: "The control reaches the evidence-context checks. Codec acceptance alone would not make a checkpoint gate evidence."
    },
    {
      id: "corrupt-magic",
      label: "Corrupt the magic bytes",
      checkpointKind: "LibbrechtKinetics v2",
      mutation: {
        target: "bytes[0]",
        operation: "replace the first byte",
        before: "V",
        after: "X"
      },
      requiredFields: ["magic=VCCCKPT1"],
      observations: [
        { stage: "framing", requirement: "bytes 0..7 equal VCCCKPT1", observed: "XCCCKPT1", disposition: "reject" }
      ],
      note: "The decoder stops at the first framing failure. It never tries to reinterpret the payload."
    },
    {
      id: "missing-surface-policy",
      label: "Delete surfacePolicy",
      checkpointKind: "LibbrechtKinetics v2",
      mutation: {
        target: "header.surfacePolicy",
        operation: "delete a required v2 field",
        before: "aggregate-hv-g1h1-v5",
        after: "missing"
      },
      requiredFields: ["version=2", "recognized surfacePolicy"],
      observations: [
        { stage: "framing", requirement: "magic and header length", observed: "valid", disposition: "accept" },
        { stage: "header", requirement: "LK v2 has a recognized surfacePolicy", observed: "field is absent", disposition: "reject" }
      ],
      note: "A forward LK checkpoint cannot silently fall back to a legacy policy."
    },
    {
      id: "short-fill-descriptor",
      label: "Shorten the f descriptor",
      checkpointKind: "LibbrechtKinetics v2",
      mutation: {
        target: "header.fields[1].length",
        operation: "subtract one without moving the raw bytes",
        before: "cellCount",
        after: "cellCount - 1"
      },
      requiredFields: [
        "fields[0]=a:u8×cellCount",
        "fields[1]=f:f64×cellCount",
        "fields[2]=sigma:f64×cellCount",
        "payload bytes exactly match the declared table"
      ],
      observations: [
        { stage: "framing", requirement: "magic and header length", observed: "valid", disposition: "accept" },
        { stage: "header", requirement: "strict LK controls", observed: "valid", disposition: "accept" },
        { stage: "fields", requirement: "the exact three-field table and exact payload length", observed: "f claims one fewer value while payload bytes are unchanged", disposition: "reject" }
      ],
      note: "This is the test suite's silently-shifted-state probe. Strict descriptors prevent sigma bytes from being read at the wrong offset."
    },
    {
      id: "negative-density",
      label: "Set sigma below −1",
      checkpointKind: "LibbrechtKinetics v2",
      mutation: {
        target: "payload.sigma[activeUnattachedCell]",
        operation: "write a finite value below the physical density floor",
        before: "−0.375",
        after: "−1.000001"
      },
      requiredFields: ["active unattached sigma >= -1", "attached sigma=0", "masked-wall sigma=0"],
      observations: [
        { stage: "framing", requirement: "magic and header length", observed: "valid", disposition: "accept" },
        { stage: "header", requirement: "strict LK controls", observed: "valid", disposition: "accept" },
        { stage: "fields", requirement: "exact table and payload length", observed: "valid", disposition: "accept" },
        { stage: "state", requirement: "sigma >= -1 on active unattached cells", observed: "−1.000001", disposition: "reject" }
      ],
      note: "Negative supersaturation is valid down to −1. Values below −1 imply negative absolute vapour density and are rejected by both writer and reader."
    },
    {
      id: "reflecting-diagnostic",
      label: "Use reflecting LK",
      checkpointKind: "LibbrechtKinetics v2",
      mutation: {
        target: "header.farField",
        operation: "change the experiment's boundary condition",
        before: "dirichlet",
        after: "reflecting"
      },
      requiredFields: ["recognized farField", "physical gate requires its registered farField"],
      observations: [
        { stage: "framing", requirement: "magic and header length", observed: "valid", disposition: "accept" },
        { stage: "header", requirement: "farField is recognized", observed: "reflecting is recognized diagnostic data", disposition: "accept" },
        { stage: "fields", requirement: "exact table and payload length", observed: "valid", disposition: "accept" },
        { stage: "state", requirement: "LK field semantics", observed: "valid", disposition: "accept" },
        { stage: "evidence-context", requirement: "physical gate uses its registered fixed-supersaturation condition", observed: "reflecting has no shell-source divergence claim and is diagnostic-only", disposition: "reject" }
      ],
      note: "The codec correctly accepts reflecting LK checkpoints. The gate, not the codec, decides that they cannot support a physical habit claim."
    },
    {
      id: "legacy-v1-clean",
      label: "Open a clean LK v1 file",
      checkpointKind: "LibbrechtKinetics v1",
      mutation: {
        target: "none",
        operation: "decode the historical format exactly as written",
        before: "version=1; no surfacePolicy field",
        after: "decoded state uses implicit legacy-v3"
      },
      requiredFields: ["version=1", "surfacePolicy field absent", "implicit decoded policy=legacy-v3"],
      observations: [
        { stage: "framing", requirement: "magic and header length", observed: "valid", disposition: "accept" },
        { stage: "header", requirement: "LK v1 must omit surfacePolicy", observed: "field absent; implicit legacy-v3", disposition: "accept" },
        { stage: "fields", requirement: "exact a/f/sigma table and payload length", observed: "valid", disposition: "accept" },
        { stage: "state", requirement: "LK field semantics", observed: "valid", disposition: "accept" },
        { stage: "evidence-context", requirement: "forward gate requires registered v2 metadata and byte-stable re-encode", observed: "re-encoding migrates to v2 with explicit legacy-v3 and changes the bytes", disposition: "reject" }
      ],
      note: "Backward-compatible decoding preserves history. It does not relabel a v1 artifact as a forward v2 gate checkpoint."
    },
    {
      id: "legacy-v1-policy-injected",
      label: "Inject a policy into LK v1",
      checkpointKind: "LibbrechtKinetics v1",
      mutation: {
        target: "header.surfacePolicy",
        operation: "add a field forbidden by this version",
        before: "absent",
        after: "legacy-v3"
      },
      requiredFields: ["version=1", "surfacePolicy field absent"],
      observations: [
        { stage: "framing", requirement: "magic and header length", observed: "valid", disposition: "accept" },
        { stage: "header", requirement: "version 1 carries no surfacePolicy", observed: "policy-bearing v1 header", disposition: "reject" }
      ],
      note: "Even a plausible value is rejected when the wire version forbids the field."
    },
    {
      id: "registered-config-mismatch",
      label: "Shift registered metadata",
      checkpointKind: "LibbrechtKinetics v2",
      mutation: {
        target: "header.surfacePolicy",
        operation: "replace one recognized policy with another",
        before: "aggregate-hv-g1h1-v6",
        after: "aggregate-hv-g1h1-v5"
      },
      requiredFields: [
        "codec recognizes surfacePolicy",
        "checkpoint metadata equals registered run",
        "decoded field bits equal final run fields",
        "re-encode is byte-stable"
      ],
      observations: [
        { stage: "framing", requirement: "magic and header length", observed: "valid", disposition: "accept" },
        { stage: "header", requirement: "surfacePolicy is recognized by the codec", observed: "aggregate-hv-g1h1-v5 is recognized", disposition: "accept" },
        { stage: "fields", requirement: "exact table and payload length", observed: "valid", disposition: "accept" },
        { stage: "state", requirement: "LK field semantics", observed: "valid", disposition: "accept" },
        { stage: "evidence-context", requirement: "metadata equals the registered run and policy", observed: "checkpoint says v5; registered run says v6", disposition: "reject" }
      ],
      note: "Well-formed bytes can describe the wrong experiment. Gate validation compares them with the registered run instead of trusting codec success."
    },
    {
      id: "unknown-gg-metric",
      label: "Smuggle a GG metric",
      checkpointKind: "GGThreshold v1",
      mutation: {
        target: "header.metrics.depletionRatio",
        operation: "add a plausible in-memory metric not in the wire schema",
        before: "absent",
        after: "0.5"
      },
      requiredFields: ["exact GG v1 metric-key set", "metrics recomputed from payload where required"],
      observations: [
        { stage: "framing", requirement: "magic and header length", observed: "valid", disposition: "accept" },
        { stage: "header", requirement: "metrics contain no unknown keys", observed: "unknown key depletionRatio", disposition: "reject" }
      ],
      note: "Strict JSON objects prevent a plausible extra field from hitching a ride into a trusted artifact."
    }
  ];

  var STAGES = ["framing", "header", "fields", "state", "evidence-context"];
  var DEFAULT_ID = "clean-lk-v2";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function byId(id) {
    for (var i = 0; i < CASES.length; i += 1) {
      if (CASES[i].id === id) return CASES[i];
    }
    throw new Error("unknown checkpoint mutation: " + id);
  }

  function derive(record) {
    var firstReject = null;
    for (var i = 0; i < record.observations.length; i += 1) {
      if (record.observations[i].disposition === "reject") {
        firstReject = record.observations[i];
        break;
      }
    }
    var reachedContext = record.observations.some(function (item) {
      return item.stage === "evidence-context";
    });
    var codecRejected = firstReject !== null && firstReject.stage !== "evidence-context";
    return {
      firstRejectStage: firstReject === null ? "none" : firstReject.stage,
      codecOutcome: codecRejected ? "rejected" : "accepted",
      contextOutcome: codecRejected ? "not-run" : (
        reachedContext && firstReject !== null ? "rejected" :
        reachedContext ? "accepted" : "not-run"
      )
    };
  }

  function addStyle() {
    if (document.getElementById("vcc-checkpoint-mutation-style")) return;
    var style = document.createElement("style");
    style.id = "vcc-checkpoint-mutation-style";
    style.textContent =
      ".ckx-grid{display:grid;grid-template-columns:minmax(12rem,.8fr) minmax(18rem,1.6fr);gap:.8rem}" +
      ".ckx-card{border:1px solid var(--rule);border-radius:8px;padding:.75rem;background:var(--surface-1)}" +
      ".ckx-card h3{font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted);margin:0 0 .45rem}" +
      ".ckx-code{font-family:var(--font-mono);font-size:.75rem;overflow-wrap:anywhere;color:var(--ink-primary);margin:.25rem 0}" +
      ".ckx-list{margin:.35rem 0 0;padding-left:1.1rem;font-size:var(--step--1);color:var(--ink-secondary)}" +
      ".ckx-pipeline{display:grid;gap:.4rem}" +
      ".ckx-stage{display:grid;grid-template-columns:8rem 1fr;gap:.6rem;border-left:3px solid var(--rule-strong);padding:.45rem .55rem;background:var(--surface-sunken)}" +
      ".ckx-stage[data-disposition='accept']{border-left-color:var(--status-good)}" +
      ".ckx-stage[data-disposition='reject']{border-left-color:var(--status-critical)}" +
      ".ckx-stage[data-disposition='not-run']{opacity:.55}" +
      ".ckx-stage b{font-size:.72rem;text-transform:uppercase;letter-spacing:.05em}" +
      ".ckx-stage span{font-size:.78rem;color:var(--ink-secondary);line-height:1.4}" +
      ".ckx-result{margin:.7rem 0 0;padding:.6rem .7rem;border:1.5px solid currentColor;border-radius:8px;font-size:var(--step--1);line-height:1.45}" +
      ".ckx-note{font-size:.78rem;color:var(--ink-muted);margin:.65rem 0 0}" +
      "@media(max-width:680px){.ckx-grid{grid-template-columns:1fr}.ckx-stage{grid-template-columns:1fr}}";
    document.head.appendChild(style);
  }

  function mount(root) {
    if (!root || root.getAttribute("data-checkpoint-mounted") === "true") return null;
    root.setAttribute("data-checkpoint-mounted", "true");
    addStyle();

    var body = root.querySelector(".anim__body");
    var controls = root.querySelector(".anim__controls");
    if (!body || !controls) return null;

    var selectedId = DEFAULT_ID;
    var buttons = {};

    function render() {
      var record = byId(selectedId);
      var outcome = derive(record);
      root.setAttribute("data-selected-mutation", record.id);
      root.setAttribute("data-checkpoint-kind", record.checkpointKind);
      root.setAttribute("data-codec-outcome", outcome.codecOutcome);
      root.setAttribute("data-context-outcome", outcome.contextOutcome);
      root.setAttribute("data-failure-stage", outcome.firstRejectStage);
      root.setAttribute("data-required-fields", record.requiredFields.join("|"));

      Object.keys(buttons).forEach(function (id) {
        buttons[id].setAttribute("aria-pressed", String(id === selectedId));
      });

      body.textContent = "";
      var grid = document.createElement("div");
      grid.className = "ckx-grid";

      var mutation = document.createElement("section");
      mutation.className = "ckx-card";
      var mh = document.createElement("h3");
      mh.textContent = "Raw mutation";
      mutation.appendChild(mh);
      [
        ["checkpoint", record.checkpointKind],
        ["target", record.mutation.target],
        ["operation", record.mutation.operation],
        ["before", record.mutation.before],
        ["after", record.mutation.after]
      ].forEach(function (row) {
        var p = document.createElement("p");
        p.className = "ckx-code";
        p.textContent = row[0] + ": " + row[1];
        mutation.appendChild(p);
      });
      var rh = document.createElement("h3");
      rh.style.marginTop = "0.8rem";
      rh.textContent = "Required fields / invariants";
      mutation.appendChild(rh);
      var list = document.createElement("ul");
      list.className = "ckx-list";
      record.requiredFields.forEach(function (field) {
        var li = document.createElement("li");
        li.textContent = field;
        list.appendChild(li);
      });
      mutation.appendChild(list);
      grid.appendChild(mutation);

      var pipelineCard = document.createElement("section");
      pipelineCard.className = "ckx-card";
      var ph = document.createElement("h3");
      ph.textContent = "Fail-closed path";
      pipelineCard.appendChild(ph);
      var pipeline = document.createElement("div");
      pipeline.className = "ckx-pipeline";

      var observedByStage = {};
      record.observations.forEach(function (item) {
        observedByStage[item.stage] = item;
      });
      var stopped = false;
      STAGES.forEach(function (stage) {
        var observation = observedByStage[stage];
        var disposition = observation ? observation.disposition : "not-run";
        if (stopped) disposition = "not-run";
        var row = document.createElement("div");
        row.className = "ckx-stage";
        row.setAttribute("data-stage", stage);
        row.setAttribute("data-disposition", disposition);
        var label = document.createElement("b");
        label.textContent = stage.replace("-", " ");
        var detail = document.createElement("span");
        if (disposition === "not-run") {
          detail.textContent = "not reached";
        } else {
          detail.textContent = observation.requirement + " → " + observation.observed +
            " [" + disposition.toUpperCase() + "]";
        }
        row.appendChild(label);
        row.appendChild(detail);
        pipeline.appendChild(row);
        if (disposition === "reject") stopped = true;
      });
      pipelineCard.appendChild(pipeline);

      var result = document.createElement("p");
      result.className = "ckx-result";
      result.setAttribute("role", "status");
      result.setAttribute("aria-live", "polite");
      result.style.color = outcome.firstRejectStage === "none"
        ? "var(--status-good)"
        : "var(--status-critical)";
      result.textContent = "Codec: " + outcome.codecOutcome +
        " · evidence context: " + outcome.contextOutcome +
        (outcome.firstRejectStage === "none" ? "" : " · first refusal: " + outcome.firstRejectStage);
      pipelineCard.appendChild(result);

      var note = document.createElement("p");
      note.className = "ckx-note";
      note.textContent = record.note;
      pipelineCard.appendChild(note);
      grid.appendChild(pipelineCard);
      body.appendChild(grid);
    }

    CASES.forEach(function (record) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "button";
      button.textContent = record.label;
      button.setAttribute("data-control", "checkpoint-case");
      button.setAttribute("data-case-id", record.id);
      button.addEventListener("click", function () {
        selectedId = record.id;
        render();
      });
      buttons[record.id] = button;
      controls.appendChild(button);
    });

    var reset = document.createElement("button");
    reset.type = "button";
    reset.className = "button";
    reset.textContent = "Reset";
    reset.setAttribute("data-control", "checkpoint-reset");
    reset.addEventListener("click", function () {
      selectedId = DEFAULT_ID;
      render();
    });
    controls.appendChild(reset);

    var api = {
      select: function (id) {
        byId(id);
        selectedId = id;
        render();
        return api.state();
      },
      reset: function () {
        selectedId = DEFAULT_ID;
        render();
        return api.state();
      },
      state: function () {
        var record = byId(selectedId);
        return {
          selectedId: selectedId,
          record: clone(record),
          derived: derive(record)
        };
      }
    };
    render();
    return api;
  }

  var root = document.querySelector("[data-demo='checkpoint-mutation-explorer']");
  var mounted = mount(root);
  window.__VCC_EDU_CHECKPOINT_EXPLORER__ = {
    schemaVersion: 1,
    cases: clone(CASES),
    mount: mount,
    select: function (id) {
      if (!mounted) throw new Error("checkpoint mutation explorer is not mounted");
      return mounted.select(id);
    },
    reset: function () {
      if (!mounted) throw new Error("checkpoint mutation explorer is not mounted");
      return mounted.reset();
    },
    state: function () {
      return mounted ? mounted.state() : null;
    }
  };
})();
