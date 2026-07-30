/* ============================================================================
   Snow Crystals — shared visualization + animation library
   ----------------------------------------------------------------------------
   Every original diagram and animation on this site is built with these
   helpers, so they share one visual language, one accessibility contract, and
   one performance contract:

     - animations pause when scrolled out of view (IntersectionObserver)
     - prefers-reduced-motion renders a single representative static frame
       instead of looping, and exposes a manual "step" control
     - colors are read from CSS custom properties, so light/dark and the
       theme toggle restyle every chart without redrawing logic
     - every series is direct-labelled as well as coloured (the relief rule)

   Nothing here is snowflake-specific except the lattice helpers at the end.
   ========================================================================= */

(function () {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ------------------------------------------------------------- scales -- */

  function scaleLinear(domain, range) {
    let [d0, d1] = domain;
    const [r0, r1] = range;
    if (d1 === d0) d1 = d0 + 1e-9;
    const m = (r1 - r0) / (d1 - d0);
    const fn = (v) => r0 + (v - d0) * m;
    fn.invert = (p) => d0 + (p - r0) / m;
    fn.domain = domain;
    fn.range = range;
    fn.ticks = (count) => niceTicks(d0, d1, count || 6);
    return fn;
  }

  function scaleLog(domain, range) {
    const [d0, d1] = domain;
    const [r0, r1] = range;
    const l0 = Math.log10(d0), l1 = Math.log10(d1);
    const m = (r1 - r0) / (l1 - l0);
    const fn = (v) => r0 + (Math.log10(v) - l0) * m;
    fn.invert = (p) => Math.pow(10, l0 + (p - r0) / m);
    fn.domain = domain;
    fn.range = range;
    fn.ticks = () => {
      const out = [];
      for (let e = Math.ceil(l0); e <= Math.floor(l1); e++) out.push(Math.pow(10, e));
      return out;
    };
    return fn;
  }

  function niceTicks(lo, hi, count) {
    const span = hi - lo;
    if (span <= 0) return [lo];
    const raw = span / count;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    const step = (norm >= 7.5 ? 10 : norm >= 3.5 ? 5 : norm >= 1.5 ? 2 : 1) * mag;
    const start = Math.ceil(lo / step) * step;
    const out = [];
    for (let v = start; v <= hi + step * 1e-6; v += step) {
      out.push(Math.abs(v) < step * 1e-9 ? 0 : Number(v.toFixed(10)));
    }
    return out;
  }

  /* ---------------------------------------------------------------- dom -- */

  function svgEl(name, attrs) {
    const node = document.createElementNS(SVG_NS, name);
    if (attrs) for (const k in attrs) {
      if (attrs[k] != null) node.setAttribute(k, String(attrs[k]));
    }
    return node;
  }

  function createSvg(parent, width, height, opts) {
    const o = opts || {};
    const svg = svgEl("svg", {
      viewBox: `0 0 ${width} ${height}`,
      width: o.fixed ? width : null,
      role: "img",
      "aria-label": o.label || null,
    });
    svg.style.maxWidth = "100%";
    svg.style.height = "auto";
    if (o.label) {
      const title = svgEl("title");
      title.textContent = o.label;
      svg.appendChild(title);
    }
    if (o.desc) {
      const desc = svgEl("desc");
      desc.textContent = o.desc;
      svg.appendChild(desc);
    }
    if (parent) parent.appendChild(svg);
    return svg;
  }

  function createCanvas(parent, width, height, opts) {
    const o = opts || {};
    const canvas = document.createElement("canvas");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = "100%";
    canvas.style.maxWidth = width + "px";
    canvas.style.height = "auto";
    canvas.style.display = "block";
    canvas.style.margin = "0 auto";
    if (o.label) {
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-label", o.label);
    }
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    if (parent) parent.appendChild(canvas);
    return { canvas: canvas, ctx: ctx, width: width, height: height, dpr: dpr };
  }

  /* --------------------------------------------------------------- ink --- */

  /** Read the live theme colors out of CSS custom properties. */
  function colors() {
    const cs = getComputedStyle(document.documentElement);
    const get = (name, fallback) => (cs.getPropertyValue(name) || fallback).trim();
    return {
      series: [
        get("--series-1", "#2a78d6"),
        get("--series-2", "#eb6834"),
        get("--series-3", "#1baf7a"),
        get("--series-4", "#eda100"),
        get("--series-5", "#e87ba4"),
      ],
      seq: [
        get("--seq-100", "#cde2fb"), get("--seq-200", "#9ec5f4"),
        get("--seq-300", "#6da7ec"), get("--seq-400", "#3987e5"),
        get("--seq-500", "#256abf"), get("--seq-600", "#184f95"),
        get("--seq-700", "#0d366b"),
      ],
      surface: get("--surface-1", "#fcfcfb"),
      sunken: get("--surface-sunken", "#f1f1ed"),
      ink: get("--ink-primary", "#0b0b0b"),
      inkSecondary: get("--ink-secondary", "#52514e"),
      muted: get("--ink-muted", "#898781"),
      rule: get("--rule", "#e1e0d9"),
      ruleStrong: get("--rule-strong", "#c3c2b7"),
      good: get("--status-good", "#0ca30c"),
      critical: get("--status-critical", "#d03b3b"),
    };
  }

  /** Interpolate a value in [0,1] along the sequential blue ramp. */
  function seqColor(t, palette) {
    const ramp = (palette || colors()).seq;
    const x = Math.max(0, Math.min(1, t)) * (ramp.length - 1);
    return ramp[Math.round(x)];
  }

  /* --------------------------------------------------------------- axes -- */

  function axisBottom(parent, scale, opts) {
    const o = opts || {};
    const g = svgEl("g", { class: "axis axis--x" });
    const y = o.y;

    g.appendChild(svgEl("line", {
      class: "axis-line", x1: scale.range[0], x2: scale.range[1], y1: y, y2: y,
    }));

    const ticks = o.values || scale.ticks(o.ticks || 6);
    ticks.forEach(function (t) {
      const x = scale(t);
      if (x < scale.range[0] - 0.5 || x > scale.range[1] + 0.5) return;
      g.appendChild(svgEl("line", { class: "axis-line", x1: x, x2: x, y1: y, y2: y + 5 }));
      const text = svgEl("text", { class: "tick-text", x: x, y: y + 18, "text-anchor": "middle" });
      text.textContent = o.format ? o.format(t) : String(t);
      g.appendChild(text);
    });

    if (o.title) {
      const title = svgEl("text", {
        class: "axis-title",
        x: (scale.range[0] + scale.range[1]) / 2,
        y: y + (o.titleOffset || 38),
        "text-anchor": "middle",
      });
      title.textContent = o.title;
      g.appendChild(title);
    }
    parent.appendChild(g);
    return g;
  }

  function axisLeft(parent, scale, opts) {
    const o = opts || {};
    const g = svgEl("g", { class: "axis axis--y" });
    const x = o.x;

    g.appendChild(svgEl("line", {
      class: "axis-line", x1: x, x2: x, y1: scale.range[0], y2: scale.range[1],
    }));

    const ticks = o.values || scale.ticks(o.ticks || 5);
    ticks.forEach(function (t) {
      const y = scale(t);
      const lo = Math.min(scale.range[0], scale.range[1]) - 0.5;
      const hi = Math.max(scale.range[0], scale.range[1]) + 0.5;
      if (y < lo || y > hi) return;
      g.appendChild(svgEl("line", { class: "axis-line", x1: x - 5, x2: x, y1: y, y2: y }));
      const text = svgEl("text", { class: "tick-text", x: x - 9, y: y + 4, "text-anchor": "end" });
      text.textContent = o.format ? o.format(t) : String(t);
      g.appendChild(text);
      if (o.grid) {
        g.insertBefore(svgEl("line", {
          class: "grid-line", x1: x, x2: o.gridTo, y1: y, y2: y,
        }), g.firstChild);
      }
    });

    if (o.title) {
      const cy = (scale.range[0] + scale.range[1]) / 2;
      const title = svgEl("text", {
        class: "axis-title",
        transform: `rotate(-90 ${x - (o.titleOffset || 44)} ${cy})`,
        x: x - (o.titleOffset || 44),
        y: cy,
        "text-anchor": "middle",
      });
      title.textContent = o.title;
      g.appendChild(title);
    }
    parent.appendChild(g);
    return g;
  }

  /* -------------------------------------------------------------- marks -- */

  function linePath(points, xs, ys) {
    let d = "";
    let pen = false;
    for (const p of points) {
      const vx = xs(p[0]), vy = ys(p[1]);
      if (!isFinite(vx) || !isFinite(vy)) { pen = false; continue; }
      d += (pen ? "L" : "M") + vx.toFixed(2) + " " + vy.toFixed(2) + " ";
      pen = true;
    }
    return d.trim();
  }

  function series(parent, points, xs, ys, opts) {
    const o = opts || {};
    const path = svgEl("path", {
      class: "series-line",
      d: linePath(points, xs, ys),
      stroke: o.color,
      "stroke-dasharray": o.dashed ? "5 4" : null,
      "stroke-width": o.width || 2,
    });
    parent.appendChild(path);

    // direct label at the line's end — the relief rule, applied everywhere
    if (o.label) {
      const last = o.labelAt || points[points.length - 1];
      const text = svgEl("text", {
        class: "series-label",
        x: xs(last[0]) + (o.labelDx == null ? 6 : o.labelDx),
        y: ys(last[1]) + (o.labelDy == null ? 4 : o.labelDy),
        fill: o.color,
        "text-anchor": o.labelAnchor || "start",
      });
      text.textContent = o.label;
      parent.appendChild(text);
    }
    return path;
  }

  function legend(container, items) {
    const box = document.createElement("div");
    box.className = "legend";
    items.forEach(function (item) {
      const wrap = document.createElement("span");
      wrap.className = "legend__item";
      const sw = document.createElement("span");
      sw.className = "legend__swatch";
      sw.style.background = item.color;
      wrap.appendChild(sw);
      wrap.appendChild(document.createTextNode(item.label));
      box.appendChild(wrap);
    });
    container.appendChild(box);
    return box;
  }

  /* ------------------------------------------------------------ controls -- */

  function slider(container, opts) {
    const o = opts || {};
    const wrap = document.createElement("div");
    wrap.className = "control";

    const id = "ctl-" + Math.abs(hashString(o.label + (o.id || ""))).toString(36);
    const label = document.createElement("label");
    label.setAttribute("for", id);
    label.textContent = o.label;

    const input = document.createElement("input");
    input.type = "range";
    input.id = id;
    input.min = o.min;
    input.max = o.max;
    input.step = o.step == null ? 1 : o.step;
    input.value = o.value;

    const out = document.createElement("output");
    out.setAttribute("for", id);

    const fmt = o.format || ((v) => String(v));
    function sync() {
      out.textContent = fmt(parseFloat(input.value));
      input.setAttribute("aria-valuetext", out.textContent);
    }
    input.addEventListener("input", function () {
      sync();
      if (o.onInput) o.onInput(parseFloat(input.value));
    });
    sync();

    wrap.appendChild(label);
    wrap.appendChild(input);
    wrap.appendChild(out);
    container.appendChild(wrap);

    return {
      element: wrap, input: input,
      get value() { return parseFloat(input.value); },
      set value(v) { input.value = v; sync(); if (o.onInput) o.onInput(parseFloat(input.value)); },
    };
  }

  function button(container, label, onClick, opts) {
    const o = opts || {};
    const b = document.createElement("button");
    b.type = "button";
    b.className = "button";
    b.textContent = label;
    if (o.pressed != null) b.setAttribute("aria-pressed", String(o.pressed));
    b.addEventListener("click", function () { onClick(b); });
    container.appendChild(b);
    return b;
  }

  function hashString(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
    return h;
  }

  /*
   * A small browser-native counterpart to core/src/prng.ts. Each call hashes
   * the immutable stream name and an explicit counter; consuming one stream
   * therefore cannot shift any other stream. The returned function is stateful
   * only in the counter it supplies to that pure hash.
   */
  function rotl32(x, r) {
    return ((x << r) | (x >>> (32 - r))) | 0;
  }

  function mixCounterWord(k) {
    k = Math.imul(k, 0xcc9e2d51);
    k = rotl32(k, 15);
    return Math.imul(k, 0x1b873593);
  }

  function mixCounterHash(h, k) {
    h ^= mixCounterWord(k);
    h = rotl32(h, 13);
    return (Math.imul(h, 5) + 0xe6546b64) | 0;
  }

  function hashCounter(seed, cellIndex, tick, streamId) {
    let h = seed | 0;
    h = mixCounterHash(h, cellIndex | 0);
    h = mixCounterHash(h, tick | 0);
    h = mixCounterHash(h, streamId | 0);
    h ^= 12;
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h >>> 0;
  }

  function hashStreamName(name) {
    let h = 0x811c9dc5;
    for (let i = 0; i < name.length; i++) {
      h ^= name.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h | 0;
  }

  function namedRng(name) {
    if (typeof name !== "string" || !name.length) {
      throw new TypeError("Viz.namedRng requires a non-empty stream name");
    }
    const streamId = hashString(name);
    const seed = hashStreamName("snow-crystals-education:" + name);
    let counter = 0;

    function next() {
      const value = hashCounter(seed, counter, name.length, streamId) / 4294967296;
      counter = (counter + 1) >>> 0;
      return value;
    }

    next.reset = function () { counter = 0; };
    return next;
  }

  /* ----------------------------------------------------------- animation -- */

  /**
   * Drive an animation loop that is polite about attention and motion.
   *
   *   Viz.animate(rootElement, function (t, dt) { … }, { restartOnEnter: true })
   *
   * - runs only while `rootElement` is on screen
   * - under prefers-reduced-motion it does NOT loop: it renders one frame at
   *   `staticAt` seconds and adds manual step/restart controls instead
   * - returns playback methods plus actual-running and requested-playback state
   */
  function animate(root, tick, opts) {
    const o = opts || {};
    let raf = null;
    let last = 0;
    let elapsed = o.startAt || 0;
    let visible = false;
    let pageVisible = !document.hidden;
    let playbackRequested = true;
    let running = false;
    let removeManualControls = null;

    function frame(now) {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      elapsed += dt;
      if (o.duration && elapsed > o.duration) {
        elapsed = o.loop === false ? o.duration : elapsed % o.duration;
        if (o.loop === false) { tick(elapsed, dt); stop(); return; }
      }
      tick(elapsed, dt);
      raf = window.requestAnimationFrame(frame);
    }

    function start() {
      if (running) return;
      running = true;
      last = 0;
      raf = window.requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (raf) window.cancelAnimationFrame(raf);
      raf = null;
    }

    function evaluate() {
      if (visible && pageVisible && playbackRequested && !reduceMotion.matches) start();
      else stop();
    }

    const io = new IntersectionObserver(function (entries) {
      visible = entries.some((e) => e.isIntersecting);
      evaluate();
    }, { rootMargin: "80px" });
    io.observe(root);

    document.addEventListener("visibilitychange", function () {
      pageVisible = !document.hidden;
      evaluate();
    });

    const api = {
      get isPlaying() { return running; },
      get isPlaybackRequested() { return playbackRequested; },
      play: function () { playbackRequested = true; evaluate(); },
      pause: function () { playbackRequested = false; stop(); },
      stop: stop,
      reset: function () { elapsed = o.startAt || 0; tick(elapsed, 0); },
      seek: function (t) { elapsed = t; tick(elapsed, 0); },
      get time() { return elapsed; },
    };

    function showReducedMotionFrame() {
      elapsed = o.staticAt != null ? o.staticAt : (o.duration ? o.duration * 0.6 : 3);
      tick(elapsed, 0);
      if (o.controls !== false && !removeManualControls) {
        removeManualControls = addManualControls(root, api, o);
      }
    }

    function hideManualControls() {
      if (!removeManualControls) return;
      removeManualControls();
      removeManualControls = null;
    }

    if (reduceMotion.matches) {
      // one representative frame, plus a manual way to advance
      showReducedMotionFrame();
    } else {
      tick(elapsed, 0);
    }

    reduceMotion.addEventListener("change", function () {
      if (reduceMotion.matches) {
        stop();
        showReducedMotionFrame();
      } else {
        hideManualControls();
        evaluate();
      }
    });
    return api;
  }

  function addManualControls(root, api, o) {
    let madeBar = false;
    const bar = root.querySelector(".anim__controls") || (function () {
      const made = document.createElement("div");
      made.className = "anim__controls";
      root.appendChild(made);
      madeBar = true;
      return made;
    })();

    const note = document.createElement("span");
    note.className = "control";
    note.style.color = "var(--ink-muted)";
    note.textContent = "Motion reduced — step through manually:";
    bar.appendChild(note);

    const stepButton = button(bar, "Step forward", function () {
      const start = o.startAt || 0;
      const step = o.stepBy || (o.duration ? Math.max(0.5, o.duration / 8) : 0.5);
      if (o.duration && api.time >= o.duration) api.seek(start);
      else api.seek(o.duration ? Math.min(o.duration, api.time + step) : api.time + step);
    });
    const restartButton = button(bar, "Restart", function () { api.reset(); });

    return function () {
      note.remove();
      stepButton.remove();
      restartButton.remove();
      if (madeBar && !bar.children.length) bar.remove();
    };
  }

  /* ------------------------------------------------- hexagonal geometry -- */

  /** Corner points of a flat-topped regular hexagon of circumradius r. */
  function hexPoints(cx, cy, r, rotationDeg) {
    const rot = ((rotationDeg || 0) * Math.PI) / 180;
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = rot + (Math.PI / 3) * i;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return pts;
  }

  function hexPath(cx, cy, r, rotationDeg) {
    return hexPoints(cx, cy, r, rotationDeg)
      .map((p, i) => (i ? "L" : "M") + p[0].toFixed(2) + " " + p[1].toFixed(2))
      .join(" ") + " Z";
  }

  /** Axial (q,r) hex coordinate -> pixel centre, pointy-top layout. */
  function hexToPixel(q, r, size) {
    return [
      size * Math.sqrt(3) * (q + r / 2),
      size * 1.5 * r,
    ];
  }

  /** Mirror a set of points into full six-fold (D6h) symmetry. */
  function sixFold(points, cx, cy) {
    const out = [];
    for (let k = 0; k < 6; k++) {
      const a = (Math.PI / 3) * k;
      const cos = Math.cos(a), sin = Math.sin(a);
      for (const p of points) {
        const dx = p[0] - cx, dy = p[1] - cy;
        out.push([cx + dx * cos - dy * sin, cy + dx * sin + dy * cos]);
        // mirror arm
        out.push([cx + dx * cos + dy * sin, cy + dx * sin - dy * cos]);
      }
    }
    return out;
  }

  /* --------------------------------------------------------- redraw hook -- */

  /** Re-run a draw function whenever the theme changes. */
  function onThemeChange(fn) {
    window.addEventListener("themechange", fn);
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", fn);
  }

  /* -------------------------------------------------------------- export -- */

  window.Viz = {
    SVG_NS: SVG_NS,
    scaleLinear: scaleLinear,
    scaleLog: scaleLog,
    niceTicks: niceTicks,
    svgEl: svgEl,
    createSvg: createSvg,
    createCanvas: createCanvas,
    colors: colors,
    seqColor: seqColor,
    axisBottom: axisBottom,
    axisLeft: axisLeft,
    linePath: linePath,
    series: series,
    legend: legend,
    slider: slider,
    button: button,
    namedRng: namedRng,
    animate: animate,
    hexPoints: hexPoints,
    hexPath: hexPath,
    hexToPixel: hexToPixel,
    sixFold: sixFold,
    onThemeChange: onThemeChange,
    reduceMotion: reduceMotion,
  };
})();
