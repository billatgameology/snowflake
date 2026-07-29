/* ============================================================================
   Snow Crystals — site behaviour
   ----------------------------------------------------------------------------
   Handles: theme toggle, reading progress, sidenav scrollspy, glossary
   tooltips, keyboard chapter nav, and — most importantly — FIGURE RESOLUTION.

   Figure resolution exists because the source figures are third-party and
   copyrighted (Libbrecht). Per decision 0004 they are NOT committed to this
   repository; they live in the gitignored research/ cache. So every paper
   figure is referenced by path and degrades to a fully-cited placeholder when
   the local cache is absent. The citation is always present either way — the
   image is the part that may be missing, never the attribution.
   ========================================================================= */

(function () {
  "use strict";

  /* ------------------------------------------------------------- helpers -- */

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

  function depth() {
    return parseInt(document.body.getAttribute("data-depth") || "0", 10);
  }

  /**
   * Path prefix from this page back to the SITE root (docs/education/).
   * Always valid, including on GitHub Pages where docs/education is published
   * as the site root and nothing above it exists.
   */
  function siteRoot() {
    return "../".repeat(depth());
  }

  /**
   * Path prefix from this page back to the REPOSITORY root.
   * Only meaningful when the site is opened from a checkout — docs/education/
   * is two levels below the repo root. On a deployed site this walks above the
   * document root, which is exactly why figure requests 404 there and fall back
   * to the cited placeholder.
   */
  function repoRoot() {
    return "../".repeat(2 + depth());
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  /* -------------------------------------------------------------- theme --- */

  const THEME_KEY = "snow-crystals-theme";

  function applyTheme(theme) {
    if (theme === "light" || theme === "dark") {
      document.documentElement.setAttribute("data-theme", theme);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  function currentTheme() {
    const stamped = document.documentElement.getAttribute("data-theme");
    if (stamped) return stamped;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) { /* private mode */ }
    if (saved) applyTheme(saved);

    const button = $("[data-theme-toggle]");
    if (!button) return;

    function sync() {
      const isDark = currentTheme() === "dark";
      button.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
      button.setAttribute("title", isDark ? "Light theme" : "Dark theme");
    }

    button.addEventListener("click", function () {
      const next = currentTheme() === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
      sync();
      // let charts/animations restyle themselves against the new surface
      window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: next } }));
    });

    sync();
  }

  /* ------------------------------------------------------------- figures -- */

  /**
   * Build one paper-figure card.
   *
   * Declarative markup, authored per chapter:
   *
   *   <figure class="figure"
   *           data-src="research/…/figures/fig-2.1/visual.png"
   *           data-source="Libbrecht, Snow Crystals (arXiv:1910.06389v2)"
   *           data-figure="Figure 2.1"
   *           data-page="PDF p. 48 · printed p. 47"
   *           data-alt="Phase diagram of water…">
   *     <figcaption class="figure__caption">…</figcaption>
   *   </figure>
   *
   * The <figcaption> is authored by hand and left untouched; everything above
   * it (image frame + citation strip) is generated here.
   */
  function buildFigure(fig) {
    const src = fig.getAttribute("data-src");
    if (!src) return;

    const source = fig.getAttribute("data-source") || "";
    const figureId = fig.getAttribute("data-figure") || "";
    const page = fig.getAttribute("data-page") || "";
    const alt = fig.getAttribute("data-alt") || figureId || "Figure from the source paper";
    const url = repoRoot() + src;

    const frame = el("div", "figure__frame");
    const img = el("img");
    img.src = url;
    img.alt = alt;
    img.decoding = "async";
    // NOT loading="lazy". A lazy image below the fold is never fetched, so it
    // never fires "error", so the citation card never replaces it — on the
    // published site, where no figure resolves, that leaves blank frames where
    // the citations should be. Eager loading costs nothing there (every request
    // 404s immediately) and a chapter holds at most ~17 figures locally.

    img.addEventListener("error", function () {
      frame.replaceWith(missingCard(src, figureId, source, page));
    });

    frame.appendChild(img);

    // citation strip — always rendered, image present or not
    const cite = el("div", "figure__cite");
    const label = el("span", "label", figureId ? figureId + " —" : "Source —");
    cite.appendChild(label);
    cite.appendChild(document.createTextNode(" " + source + (page ? " · " + page : "")));

    const path = el("div", "figure__source", src);
    cite.appendChild(path);

    fig.insertBefore(frame, fig.firstChild);
    fig.appendChild(cite);
  }

  /**
   * Shown in place of a source figure that is not available.
   *
   * This is the normal state on the published site: the figures are Kenneth
   * Libbrecht's copyrighted work and are deliberately not redistributed, so the
   * card's job is not to apologise but to send the reader to the real thing —
   * the exact paper, figure number and page, one click away.
   */
  function missingCard(src, figureId, source, page) {
    const box = el("div", "figure__missing");
    box.appendChild(el("h4", null, (figureId || "This figure") + " is in the source paper"));

    const p = el("p");
    p.appendChild(document.createTextNode(
      "We cite this figure but do not reproduce it here — it is the author's copyrighted work. " +
      "Everything else on the page is ours and works without it: the explanation, the original " +
      "diagrams, and every animation."
    ));
    box.appendChild(p);

    const where = el("p");
    const strong = el("strong", null, "Find it at: ");
    where.appendChild(strong);
    where.appendChild(document.createTextNode(
      source + (figureId ? ", " + figureId : "") + (page ? ", " + page : "")
    ));
    box.appendChild(where);

    // arXiv id lives inside the citation string, e.g. "…(arXiv:1910.06389v2)"
    const arxiv = /arXiv:\s*([0-9]{4}\.[0-9]{4,5})(v[0-9]+)?/i.exec(source || "");
    if (arxiv) {
      const open = el("p");
      const a = el("a", null, "Open the paper on arXiv →");
      a.href = "https://arxiv.org/abs/" + arxiv[1];
      a.rel = "noopener";
      open.appendChild(a);
      box.appendChild(open);
    }

    const note = el("p");
    note.appendChild(document.createTextNode("Reading from a checkout? The image belongs at "));
    note.appendChild(el("code", null, src));
    note.appendChild(document.createTextNode(" — see "));
    const link = el("a", null, "FIGURES.md");
    link.href = siteRoot() + "FIGURES.md";
    note.appendChild(link);
    note.appendChild(document.createTextNode(" for how to restore it."));
    box.appendChild(note);

    return box;
  }

  function initFigures() { $$(".figure[data-src]").forEach(buildFigure); }

  /* ------------------------------------------------------------ progress -- */

  function initProgress() {
    const fill = $(".progress-rail__fill");
    if (!fill) return;

    let ticking = false;
    function update() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const pct = scrollable > 0 ? (doc.scrollTop / scrollable) * 100 : 0;
      fill.style.width = Math.min(100, Math.max(0, pct)) + "%";
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ------------------------------------------------------------ scrollspy -- */

  function initScrollSpy() {
    const nav = $(".sidenav");
    if (!nav) return;

    const links = $$('a[href^="#"]', nav);
    if (!links.length) return;

    const byId = new Map();
    const targets = [];
    links.forEach(function (link) {
      const id = decodeURIComponent(link.getAttribute("href").slice(1));
      const target = document.getElementById(id);
      if (target) { byId.set(target, link); targets.push(target); }
    });
    if (!targets.length) return;

    let active = null;
    function setActive(link) {
      if (active === link) return;
      if (active) active.removeAttribute("aria-current");
      if (link) {
        link.setAttribute("aria-current", "true");
        // keep the active item in view within the sticky rail
        const navBox = nav.getBoundingClientRect();
        const linkBox = link.getBoundingClientRect();
        if (linkBox.top < navBox.top || linkBox.bottom > navBox.bottom) {
          link.scrollIntoView({ block: "nearest" });
        }
      }
      active = link;
    }

    const observer = new IntersectionObserver(function () {
      // pick the last heading whose top is above the reading line
      const line = window.innerHeight * 0.25;
      let best = null;
      for (const target of targets) {
        if (target.getBoundingClientRect().top <= line) best = target;
      }
      if (!best) best = targets[0];
      setActive(byId.get(best) || null);
    }, { rootMargin: "-20% 0px -70% 0px", threshold: [0, 1] });

    targets.forEach(function (t) { observer.observe(t); });

    // IntersectionObserver alone is jumpy on fast scrolls; back it with scroll
    let ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        const line = window.innerHeight * 0.25;
        let best = null;
        for (const target of targets) {
          if (target.getBoundingClientRect().top <= line) best = target;
        }
        if (!best) best = targets[0];
        setActive(byId.get(best) || null);
        ticking = false;
      });
    }, { passive: true });
  }

  /* ------------------------------------------------------- keyboard nav --- */

  function initKeyboardNav() {
    document.addEventListener("keydown", function (event) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = (event.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (event.target.isContentEditable) return;

      if (event.key === "ArrowLeft") {
        const prev = $('.chapter-nav__link.is-prev');
        if (prev) { window.location.href = prev.href; }
      } else if (event.key === "ArrowRight") {
        const next = $('.chapter-nav__link.is-next');
        if (next) { window.location.href = next.href; }
      }
    });
  }

  /* -------------------------------------------------------------- boot ---- */

  function boot() {
    initTheme();
    initFigures();
    initProgress();
    initScrollSpy();
    initKeyboardNav();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  // expose for animation modules
  window.SnowSite = {
    repoRoot: repoRoot, siteRoot: siteRoot,
    currentTheme: currentTheme, $: $, $$: $$, el: el,
  };
})();
