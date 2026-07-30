/* ============================================================================
   Rights-aware real-growth movie.

   The public artifact is always useful without the copyrighted media: it
   starts as a source card linking to SnowCrystals.com. If an offline page
   supplies a readable `data-local-video` path, this script progressively
   enhances the card into a video with an explicit time scrubber. It never
   fetches the remote movie URL and never embeds a remote preview image.

   The authored public page carries only an inert `data-offline-video-source`
   marker. build-local.mjs resolves and replaces that marker; the public
   artifact therefore has no active local-video URL to probe.
   ========================================================================== */

(function () {
  "use strict";

  const root = document.getElementById("anim-real-growth");
  if (!root || !window.Viz) return;

  const body = root.querySelector(".anim__body");
  const controls = root.querySelector(".anim__controls");
  const head = root.querySelector(".anim__head");
  const localPath = root.getAttribute("data-local-video") || "";
  const sourceUrl =
    root.getAttribute("data-source-url") ||
    "https://www.snowcrystals.com/videos/videos.html";
  const directSourceUrl =
    root.getAttribute("data-direct-source-url") ||
    "https://www.snowcrystals.com/videos/1aMonoMovie.mp4";

  const status = document.createElement("p");
  status.className = "anim__sub";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.style.fontWeight = "600";
  head.appendChild(status);

  root.dataset.mediaMode = "source-card";
  root.dataset.localPathConfigured = String(Boolean(localPath));
  root.dataset.videoReady = "false";
  root.dataset.videoTime = "0.000";
  root.dataset.videoDuration = "0.000";
  root.dataset.remoteMediaFetched = "false";

  function renderSourceCard(reason) {
    body.textContent = "";
    controls.textContent = "";
    const card = document.createElement("aside");
    card.className = "callout callout--method";

    const label = document.createElement("p");
    label.className = "callout__label";
    label.textContent = "Source movie";
    card.appendChild(label);

    const text = document.createElement("p");
    text.appendChild(document.createTextNode(
      "Kenneth G. Libbrecht's laboratory time-lapse shows a real snow crystal growing while " +
      "surrounding droplets disappear. The public course links to it but does not redistribute " +
      "the copyrighted movie. "
    ));
    const pageLink = document.createElement("a");
    pageLink.href = sourceUrl;
    pageLink.textContent = "Open the SnowCrystals.com video catalog";
    text.appendChild(pageLink);
    text.appendChild(document.createTextNode(" or "));
    const movieLink = document.createElement("a");
    movieLink.href = directSourceUrl;
    movieLink.textContent = "open this movie at its source";
    text.appendChild(movieLink);
    text.appendChild(document.createTextNode("."));
    card.appendChild(text);

    body.appendChild(card);
    root.dataset.mediaMode = "source-card";
    root.dataset.videoReady = "false";
    root.dataset.fallbackReason = reason || "public-rights-boundary";
    status.textContent =
      "Source-card mode: no movie bytes are embedded or fetched by this page. " +
      "An offline build may supply the local research copy.";
  }

  renderSourceCard("awaiting-local-video");
  if (!localPath) return;

  const probe = document.createElement("video");
  probe.preload = "metadata";
  probe.muted = true;
  probe.playsInline = true;

  let settled = false;
  function fail(reason) {
    if (settled) return;
    settled = true;
    renderSourceCard(reason);
  }

  probe.addEventListener("error", function () {
    fail("local-video-unavailable");
  }, { once: true });

  probe.addEventListener("loadedmetadata", function () {
    if (settled) return;
    settled = true;

    const duration = isFinite(probe.duration) && probe.duration > 0 ? probe.duration : 0;
    if (!duration) {
      renderSourceCard("local-video-missing-duration");
      return;
    }

    body.textContent = "";
    controls.textContent = "";
    probe.controls = false;
    probe.style.width = "100%";
    probe.style.maxHeight = "32rem";
    probe.style.display = "block";
    probe.setAttribute(
      "aria-label",
      "Laboratory time-lapse of a real growing snow crystal surrounded by droplets."
    );
    body.appendChild(probe);

    root.dataset.mediaMode = "local-video";
    root.dataset.videoReady = "true";
    root.dataset.fallbackReason = "none";
    root.dataset.videoDuration = duration.toFixed(3);

    function syncPlaybackButton() {
      const playing = !probe.paused && !probe.ended;
      playButton.textContent = playing ? "Pause" : "Play";
      playButton.setAttribute("aria-pressed", String(playing));
    }

    const playButton = Viz.button(controls, "Play", function () {
      if (probe.paused) {
        try {
          const promise = probe.play();
          if (promise && typeof promise.catch === "function") {
            promise.catch(syncPlaybackButton);
          }
        } catch {
          syncPlaybackButton();
        }
      } else {
        probe.pause();
        // `pause` is dispatched asynchronously in some browsers. Reflect the
        // already-paused media state in the button during this click turn.
        syncPlaybackButton();
      }
    }, { pressed: false });
    playButton.dataset.control = "play-pause";

    const scrubber = Viz.slider(controls, {
      label: "Movie time",
      id: "real-growth-time",
      min: 0,
      max: duration,
      step: Math.max(0.01, duration / 1000),
      value: 0,
      format: function (v) { return v.toFixed(1) + " / " + duration.toFixed(1) + " s"; },
      onInput: function (v) {
        probe.currentTime = Math.max(0, Math.min(duration, v));
        syncState(true);
      },
    });
    scrubber.input.dataset.control = "movie-time";

    Viz.button(controls, "Back 1 s", function () {
      probe.pause();
      syncPlaybackButton();
      probe.currentTime = Math.max(0, probe.currentTime - 1);
      syncState(true);
    }).dataset.control = "back-one-second";

    Viz.button(controls, "Forward 1 s", function () {
      probe.pause();
      syncPlaybackButton();
      probe.currentTime = Math.min(duration, probe.currentTime + 1);
      syncState(true);
    }).dataset.control = "forward-one-second";

    function syncState(announce) {
      const time = Math.max(0, Math.min(duration, probe.currentTime || 0));
      scrubber.input.value = String(time);
      const output = scrubber.element.querySelector("output");
      if (output) output.textContent = time.toFixed(1) + " / " + duration.toFixed(1) + " s";
      scrubber.input.setAttribute("aria-valuetext", time.toFixed(1) + " seconds");
      root.dataset.videoTime = time.toFixed(3);
      if (announce) {
        status.textContent =
          "Offline movie at " + time.toFixed(1) + " of " + duration.toFixed(1) +
          " seconds. Scrub from the small seed through branching and the clearing of nearby droplets.";
      }
    }

    // Keep the visible clock current without flooding the polite live region
    // with announcements on every playback tick.
    probe.addEventListener("timeupdate", function () { syncState(false); });
    probe.addEventListener("seeked", function () { syncState(false); });
    probe.addEventListener("play", syncPlaybackButton);
    probe.addEventListener("pause", syncPlaybackButton);
    probe.addEventListener("ended", function () {
      syncPlaybackButton();
      syncState(true);
    });
    syncPlaybackButton();
    syncState(true);
  }, { once: true });

  /* Setting load explicitly makes local file:// use reliable while retaining
     the source-card fallback when the path is absent from the public build. */
  probe.src = localPath;
  probe.load();
})();
