/* ============================================================================
   Part Two, Chapters 30–33 — shared evidence components
   ----------------------------------------------------------------------------
   Chapters 30–33 all teach the same three shapes of thing, so those shapes are
   built once here instead of four times inline:

     Part2.gateBoard   a list of named checks with lamps, a predict-first sort,
                       sabotage buttons that mutate an in-page copy of a record,
                       and an exit code.  Chapter 30 mounts it for gate6's
                       thirteen criteria; Chapter 33 for gate10's seven.
     Part2.dotStrip    one dot per recorded comparison, in lanes, on a log axis,
                       with a registered criterion line and an optional what-if
                       line.  Chapter 33 mounts it for the 64 ladder rows;
                       Chapter 32 for the six per-history contests.
     Part2.barRows     labelled horizontal bars with an optional rule line, used
                       wherever a handful of recorded numbers need comparing.
     Part2.recordCard  a titled card of field/value rows, for laboratory records
                       and model operands.
     Part2.stamp       the outcome stamp Chapter 33 uses for its four words.

   Everything here follows the site contract: colours come from CSS custom
   properties so the theme toggle restyles without redrawing logic, every series
   is direct-labelled as well as coloured, nothing animates (these are all
   deterministic renders, which is what the browser verifier requires), and no
   component ever invents a number — callers pass in committed values.
   ========================================================================= */

(function () {
  "use strict";

  /* --------------------------------------------------------------- dom --- */

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  /**
   * A row of mutually exclusive buttons with aria-pressed kept in sync.
   * Returns a select(name) function so a caller can drive it programmatically.
   */
  function tabs(container, names, onPick, opts) {
    var o = opts || {};
    var buttons = names.map(function (name) {
      return Viz.button(container, name, function () { select(name); }, { pressed: false });
    });
    function select(name) {
      buttons.forEach(function (b, i) { b.setAttribute("aria-pressed", String(names[i] === name)); });
      onPick(name);
    }
    select(o.initial || names[0]);
    select.buttons = buttons;
    return select;
  }

  /**
   * A 32-bit FNV-1a hash of a string.
   *
   * This is a LABELLED STAND-IN for SHA-256, not a verification: it exists so a
   * demo can show that changing a byte changes a fingerprint. Every caller must
   * say so on the page. (Viz has an internal hashString, but it is not
   * exported, so the stand-in lives here where it can carry its own warning.)
   */
  function hash32(s) {
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, "0");
  }

  /* ------------------------------------------------------------- lamps --- */

  /**
   * A pass/fail/neutral lamp drawn as an SVG shape plus a word, never colour
   * alone: pass is a filled circle with a tick, fail an outlined circle with a
   * cross, neutral an empty circle with a dash.
   */
  function lamp(state) {
    var c = Viz.colors();
    var wrap = el("span", "p2-lamp");
    var svg = Viz.createSvg(wrap, 18, 18, { fixed: true });
    svg.setAttribute("aria-hidden", "true");
    svg.style.width = "18px";
    svg.style.height = "18px";
    var colour = state === "pass" ? c.good : state === "fail" ? c.critical : c.muted;
    svg.appendChild(Viz.svgEl("circle", {
      cx: 9, cy: 9, r: 7.5, fill: state === "pass" ? colour : "none",
      stroke: colour, "stroke-width": 1.8,
    }));
    if (state === "pass") {
      svg.appendChild(Viz.svgEl("path", {
        d: "M5.4 9.2 L8 11.8 L12.8 6.2", fill: "none",
        stroke: Viz.colors().surface, "stroke-width": 2, "stroke-linecap": "round",
      }));
    } else if (state === "fail") {
      svg.appendChild(Viz.svgEl("path", {
        d: "M6 6 L12 12 M12 6 L6 12", fill: "none",
        stroke: colour, "stroke-width": 2, "stroke-linecap": "round",
      }));
    } else {
      svg.appendChild(Viz.svgEl("path", {
        d: "M5.5 9 L12.5 9", fill: "none", stroke: colour, "stroke-width": 2, "stroke-linecap": "round",
      }));
    }
    wrap.appendChild(el("span", "p2-lamp__word", state === "pass" ? "pass" : state === "fail" ? "FAIL" : "not asked"));
    wrap.classList.add("is-" + state);
    return wrap;
  }

  /* --------------------------------------------------------- gate board --- */

  /**
   * Mount a closure-gate teaching board.
   *
   *   spec.criteria  [{ id, plain, kind }]   kind: "record" | "nature"
   *   spec.initial   () => state             a fresh in-page copy of the record
   *   spec.evaluate  (state) => { id: { pass, reasons[] } }
   *   spec.sabotage  [{ label, note, apply(state) }]
   *   spec.predict   boolean                 show the sort-first step
   *   spec.exitNote  (allPass) => string
   *   spec.footNote  string                  printed under every render
   *
   * The board never touches a real artifact: `initial()` returns a plain object
   * the buttons mutate and Reset discards.
   */
  function gateBoard(root, spec) {
    var stage = root.querySelector(".p2-stage") || root.querySelector(".anim__body");
    var controls = root.querySelector(".anim__controls");
    var state = spec.initial();
    var applied = [];
    var sorted = {};          // criterion id -> "record" | "nature"
    var revealed = !spec.predict;

    function render() {
      clear(stage);
      var results = spec.evaluate(state);
      var allPass = spec.criteria.every(function (c) { return results[c.id].pass; });

      if (!revealed) {
        stage.appendChild(el("p", "p2-note",
          "Before the lamps light: does each check ask about the record the project " +
          "wrote, or about nature? Sort them, then reveal."));
      }

      var list = el("div", "p2-checks");
      spec.criteria.forEach(function (c) {
        var row = el("div", "p2-check");
        var head = el("div", "p2-check__head");
        head.appendChild(el("code", "p2-check__id", c.id));
        if (revealed) head.appendChild(lamp(results[c.id].pass ? "pass" : "fail"));
        row.appendChild(head);
        row.appendChild(el("p", "p2-check__plain", c.plain));
        if (!revealed) {
          var pick = el("div", "p2-check__pick");
          ["record", "nature"].forEach(function (kind) {
            var b = Viz.button(pick, kind === "record" ? "asks about the record" : "asks about nature",
              function () { sorted[c.id] = kind; render(); },
              { pressed: sorted[c.id] === kind });
            b.classList.add("p2-mini");
          });
          row.appendChild(pick);
        } else if (results[c.id].reasons.length) {
          var why = el("ul", "p2-check__why");
          results[c.id].reasons.forEach(function (r) { why.appendChild(el("li", null, r)); });
          row.appendChild(why);
        }
        list.appendChild(row);
      });
      stage.appendChild(list);

      if (!revealed) {
        var n = Object.keys(sorted).length;
        stage.appendChild(el("p", "p2-note", "Sorted " + n + " of " + spec.criteria.length + "."));
        return;
      }

      var passes = spec.criteria.filter(function (c) { return results[c.id].pass; }).length;
      var exit = allPass ? 0 : 1;
      var card = el("div", "p2-verdict");
      card.appendChild(el("span", "p2-kicker", "result"));
      card.appendChild(el("div", "p2-verdict__num", passes + " / " + spec.criteria.length + " · exit " + exit));
      card.appendChild(el("p", "p2-note", spec.exitNote(allPass)));
      if (applied.length) {
        card.appendChild(el("p", "p2-note", "Applied to the in-page copy: " + applied.join("; ") + "."));
      }
      card.appendChild(el("p", "p2-note", spec.footNote));
      stage.appendChild(card);
    }

    if (spec.predict) {
      Viz.button(controls, "Reveal the lamps", function (b) {
        revealed = true;
        b.disabled = true;
        var wrong = spec.criteria.filter(function (c) { return sorted[c.id] === "nature"; }).length;
        render();
        stage.insertBefore(el("p", "p2-note",
          wrong === 0
            ? "Every one of the " + spec.criteria.length + " checks asks about the record. None asks about nature."
            : "You filed " + wrong + " under nature. The record's answer: all " +
              spec.criteria.length + " ask about the record; not one asks about nature."),
          stage.firstChild);
      });
    }

    spec.sabotage.forEach(function (s) {
      Viz.button(controls, s.label, function () {
        s.apply(state);
        applied.push(s.note || s.label);
        revealed = true;
        render();
      });
    });

    Viz.button(controls, "Reset to the committed record", function () {
      state = spec.initial();
      applied = [];
      sorted = {};
      revealed = !spec.predict;
      render();
    });

    Viz.onThemeChange(render);
    render();
    return { render: render };
  }

  /* ---------------------------------------------------------- dot strip --- */

  /**
   * One dot per recorded comparison, in horizontal lanes, on a log axis.
   *
   *   spec.lanes     [{ key, label }]
   *   spec.rows      [{ lane, value, name, detail }]
   *   spec.criterion { value, label }          the registered line (fixed)
   *   spec.axis      { min, max, title }
   *   spec.zeroLabel string                    bin for exact zeros
   *
   * Returns { draw(whatIf), selected }. `whatIf` is a second, draggable line;
   * pass null to hide it. Selecting a dot prints its detail underneath.
   */
  function dotStrip(container, spec) {
    var W = 720;
    var laneH = 44;
    var padL = 168, padR = 26, padT = 18, padB = 52;
    var H = padT + spec.lanes.length * laneH + padB;
    var selected = null;
    var svg = null;

    var detail = el("p", "p2-note p2-detail", spec.hint || "Choose a dot to see the two counts it compares.");

    function draw(whatIf) {
      if (svg) svg.remove();
      var c = Viz.colors();
      svg = Viz.createSvg(container, W, H, {
        label: spec.label,
        desc: spec.desc,
      });
      container.insertBefore(svg, detail);

      var zeroX = padL - 34;
      var x = Viz.scaleLog([spec.axis.min, spec.axis.max], [padL, W - padR]);

      /* axis */
      Viz.axisBottom(svg, x, {
        y: H - padB + 8,
        values: x.ticks(),
        format: function (v) { return (v * 100).toFixed(v < 0.01 ? 1 : 0) + " %"; },
        title: spec.axis.title,
      });
      var zt = Viz.svgEl("text", { class: "tick-text", x: zeroX, y: H - padB + 26, "text-anchor": "middle" });
      zt.textContent = spec.zeroLabel || "exactly 0";
      svg.appendChild(zt);

      /* criterion line — always drawn, always labelled */
      function rule(value, colour, label, dashed, dy) {
        var px = x(value);
        svg.appendChild(Viz.svgEl("line", {
          x1: px, x2: px, y1: padT - 4, y2: H - padB + 8,
          stroke: colour, "stroke-width": 2, "stroke-dasharray": dashed ? "5 4" : null,
        }));
        var t = Viz.svgEl("text", {
          class: "series-label", x: px + 5, y: padT + (dy || 0) + 6, fill: colour,
        });
        t.textContent = label;
        svg.appendChild(t);
      }

      spec.lanes.forEach(function (lane, li) {
        var y = padT + li * laneH + laneH / 2;
        var rows = spec.rows.filter(function (r) { return r.lane === lane.key; });
        var fails = rows.filter(function (r) {
          return r.value > (whatIf == null ? spec.criterion.value : whatIf);
        }).length;

        var lt = Viz.svgEl("text", { class: "tick-text", x: padL - 56, y: y - 3, "text-anchor": "end" });
        lt.textContent = lane.label;
        svg.appendChild(lt);
        var lc = Viz.svgEl("text", { class: "tick-text", x: padL - 56, y: y + 12, "text-anchor": "end" });
        lc.textContent = fails + " of " + rows.length + " over the line";
        lc.setAttribute("fill", fails ? c.critical : c.good);
        svg.appendChild(lc);

        svg.appendChild(Viz.svgEl("line", {
          x1: zeroX, x2: W - padR, y1: y, y2: y, stroke: c.rule, "stroke-width": 1,
        }));

        rows.forEach(function (r, ri) {
          var over = r.value > (whatIf == null ? spec.criterion.value : whatIf);
          var px = r.value <= 0 ? zeroX : x(Math.max(spec.axis.min, r.value));
          /* deterministic jitter so coincident dots stay countable */
          var dy = ((ri % 3) - 1) * 5;
          var dot = Viz.svgEl("circle", {
            cx: px, cy: y + dy, r: selected === r ? 7 : 5,
            fill: over ? c.critical : c.good,
            stroke: selected === r ? c.ink : "none", "stroke-width": 2,
            tabindex: "0", role: "button",
            "aria-label": r.name + ", " + (r.value * 100).toFixed(2) + " per cent, " + (over ? "over" : "under") + " the line",
          });
          dot.style.cursor = "pointer";
          function pick() { selected = r; detail.textContent = r.detail; draw(whatIf); }
          dot.addEventListener("click", pick);
          dot.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
          svg.appendChild(dot);
        });
      });

      rule(spec.criterion.value, c.ink, spec.criterion.label, false, 0);
      if (whatIf != null && Math.abs(whatIf - spec.criterion.value) > 1e-12) {
        rule(whatIf, c.series[3], "your line", true, 16);
      }
    }

    container.appendChild(detail);
    return { draw: draw, get selected() { return selected; } };
  }

  /* ---------------------------------------------------------- bar rows --- */

  /**
   * Labelled horizontal bars with an optional rule line.
   *
   *   rows  [{ label, value, display, fail, muted, note }]
   *   opts  { max, rule: { value, label }, caption }
   */
  function barRows(container, rows, opts) {
    var o = opts || {};
    var max = o.max != null ? o.max : Math.max.apply(null, rows.map(function (r) { return r.value; })) * 1.05;
    var wrap = el("div", "p2-bars");
    rows.forEach(function (r) {
      var row = el("div", "p2-bar");
      row.appendChild(el("strong", null, r.label));
      var track = el("div", "p2-bar__track");
      var fill = el("div", "p2-bar__fill" + (r.fail ? " is-fail" : "") + (r.muted ? " is-muted" : ""));
      fill.style.width = Math.max(0.6, Math.min(100, (r.value / max) * 100)) + "%";
      track.appendChild(fill);
      if (o.rule) {
        var mark = el("div", "p2-bar__rule");
        mark.style.left = Math.min(100, (o.rule.value / max) * 100) + "%";
        mark.setAttribute("aria-hidden", "true");
        track.appendChild(mark);
      }
      row.appendChild(track);
      row.appendChild(el("span", "p2-bar__value", r.display));
      wrap.appendChild(row);
      if (r.note) wrap.appendChild(el("p", "p2-note p2-bar__note", r.note));
    });
    container.appendChild(wrap);
    if (o.rule) container.appendChild(el("p", "p2-note", "The upright mark is " + o.rule.label + "."));
    if (o.caption) container.appendChild(el("p", "p2-note", o.caption));
    return wrap;
  }

  /* -------------------------------------------------------- record card --- */

  /**
   * A titled card of field/value rows.
   *   spec { kicker, title, fields: [[label, value]], note, state }
   *   state: "ok" | "refused" | null — adds a coloured left edge and a word.
   */
  function recordCard(spec) {
    var card = el("div", "p2-card" + (spec.state ? " is-" + spec.state : ""));
    if (spec.kicker) card.appendChild(el("span", "p2-kicker", spec.kicker));
    if (spec.title) card.appendChild(el("b", null, spec.title));
    if (spec.fields && spec.fields.length) {
      var dl = el("dl", "p2-fields");
      spec.fields.forEach(function (f) {
        dl.appendChild(el("dt", null, f[0]));
        dl.appendChild(el("dd", null, f[1]));
      });
      card.appendChild(dl);
    }
    if (spec.note) card.appendChild(el("p", "p2-note", spec.note));
    return card;
  }

  /* -------------------------------------------------------------- stamp --- */

  /** The outcome stamp: one word, its clause, and what it would take to continue. */
  function stamp(spec) {
    var box = el("div", "p2-stamp" + (spec.hypothetical ? " is-hypothetical" : ""));
    box.appendChild(el("div", "p2-kicker", spec.kicker));
    box.appendChild(el("strong", null, spec.word));
    if (spec.clause) box.appendChild(el("p", "p2-note", spec.clause));
    if (spec.authority) {
      box.appendChild(el("p", "p2-note p2-authority", "To continue: " + spec.authority));
    }
    return box;
  }

  /* ------------------------------------------------------------- export --- */

  window.Part2 = {
    el: el,
    clear: clear,
    tabs: tabs,
    hash32: hash32,
    lamp: lamp,
    gateBoard: gateBoard,
    dotStrip: dotStrip,
    barRows: barRows,
    recordCard: recordCard,
    stamp: stamp,
  };
})();
