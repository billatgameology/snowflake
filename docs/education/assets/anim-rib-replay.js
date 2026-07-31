(function () {
  "use strict";

  const root = document.getElementById("rib-schedule");
  if (!root || !window.Viz) return;

  const body = root.querySelector(".anim__body");
  const controls = root.querySelector(".anim__controls");
  const head = root.querySelector(".anim__head");

  const W = 700;
  const H = 275;
  const plot = { x0: 46, x1: W - 24, y0: 188, y1: 24 };
  const topY = 62;
  const BASE = 6;
  const FULL_GROWTH_RATE = 1;
  const DIP_COUNT = 4;
  const DISPLAY_SECONDS = 16;

  let depth = 0.5;
  let duration = 30;
  let interval = 50;
  let schedule = null;
  let scheduleTime = 0;
  let svg = null;
  let playback = null;
  let internalScrubUpdate = false;

  const status = document.createElement("p");
  status.className = "anim__sub";
  status.setAttribute("role", "status");
  status.style.fontWeight = "600";
  head.appendChild(status);

  const legendBox = document.createElement("div");
  body.appendChild(legendBox);

  function clamp(value, low, high) {
    return Math.max(low, Math.min(high, value));
  }

  function computeSchedule(nextDepth, nextDuration, nextInterval) {
    const safeDepth = clamp(nextDepth, 0.1, 1);
    const safeDuration = Math.max(0, nextDuration);
    const safeInterval = Math.max(0, nextInterval);
    const dipGrowthRate = FULL_GROWTH_RATE * (1 - 0.85 * safeDepth);
    const ribProminence = 0.9 * safeDepth * safeDuration;
    const ribWidth = dipGrowthRate * safeDuration;
    const clearGap = FULL_GROWTH_RATE * safeInterval;
    const segments = [];
    const dips = [];
    let time = 0;
    let radius = 0;

    for (let index = 0; index < DIP_COUNT; index++) {
      const restored = {
        kind: "restored",
        index: index,
        timeStart: time,
        timeEnd: time + safeInterval,
        radiusStart: radius,
        radiusEnd: radius + clearGap,
      };
      segments.push(restored);
      time = restored.timeEnd;
      radius = restored.radiusEnd;

      const dip = {
        kind: "dip",
        index: index,
        timeStart: time,
        timeEnd: time + safeDuration,
        radiusStart: radius,
        radiusEnd: radius + ribWidth,
        prominence: ribProminence,
      };
      segments.push(dip);
      dips.push(dip);
      time = dip.timeEnd;
      radius = dip.radiusEnd;
    }

    return {
      segments: segments,
      dips: dips,
      totalTime: time,
      totalRadius: radius,
      dipGrowthRate: dipGrowthRate,
      ribProminence: ribProminence,
      ribWidth: ribWidth,
      clearGap: clearGap,
      crestSpacing: clearGap + ribWidth,
    };
  }

  function stateAt(currentSchedule, requestedTime) {
    const time = clamp(requestedTime, 0, currentSchedule.totalTime);
    let segment = currentSchedule.segments[currentSchedule.segments.length - 1];

    for (const candidate of currentSchedule.segments) {
      // A shared endpoint belongs to the segment that starts there. Otherwise
      // a just-completed dip is still announced as active at its end time.
      if (time < candidate.timeEnd) {
        segment = candidate;
        break;
      }
    }

    const span = Math.max(Number.EPSILON, segment.timeEnd - segment.timeStart);
    const fraction = clamp((time - segment.timeStart) / span, 0, 1);
    const visibleRadius =
      segment.radiusStart + fraction * (segment.radiusEnd - segment.radiusStart);
    const completedRibs = currentSchedule.dips.filter(function (dip) {
      return dip.timeEnd <= time;
    }).length;

    return {
      time: time,
      visibleRadius: visibleRadius,
      kind: time >= currentSchedule.totalTime ? "complete" : segment.kind,
      dipIndex: segment.kind === "dip" && time < currentSchedule.totalTime ? segment.index : null,
      completedRibs: completedRibs,
    };
  }

  function thicknessAt(radius, dips) {
    for (const dip of dips) {
      if (radius >= dip.radiusStart && radius <= dip.radiusEnd) {
        const span = Math.max(Number.EPSILON, dip.radiusEnd - dip.radiusStart);
        const phase = (radius - dip.radiusStart) / span;
        return BASE + dip.prominence * Math.sin(Math.PI * phase);
      }
    }
    return BASE;
  }

  function buildLegend() {
    const colors = Viz.colors();
    legendBox.textContent = "";
    Viz.legend(legendBox, [
      {
        color: colors.series[0],
        label: "plate edge already grown (cutaway; underside below the flat top)",
      },
      {
        color: colors.series[1],
        label: "radius added during a low-supersaturation interval",
      },
    ]);
  }

  function updateData(state) {
    root.dataset.ribCount = String(schedule.dips.length);
    root.dataset.completedRibCount = String(state.completedRibs);
    root.dataset.ribProminence = schedule.ribProminence.toFixed(3);
    root.dataset.ribClearGap = schedule.clearGap.toFixed(3);
    root.dataset.ribWidth = schedule.ribWidth.toFixed(3);
    root.dataset.ribSpacing = schedule.crestSpacing.toFixed(3);
    root.dataset.ribCrestSpacing = schedule.crestSpacing.toFixed(3);
    root.dataset.totalRadius = schedule.totalRadius.toFixed(3);
    root.dataset.visibleRadius = state.visibleRadius.toFixed(3);
    root.dataset.scheduleTime = state.time.toFixed(3);
    root.dataset.scheduleTotalTime = schedule.totalTime.toFixed(3);
    root.dataset.scheduleState = state.kind;
    root.dataset.activeDip =
      state.dipIndex == null ? "none" : String(state.dipIndex + 1);
    root.dataset.replayScale =
      (schedule.totalTime / DISPLAY_SECONDS).toFixed(6) + " schedule-seconds/display-second";
  }

  function render(requestedTime) {
    scheduleTime = clamp(requestedTime, 0, schedule.totalTime);
    const state = stateAt(schedule, scheduleTime);
    const colors = Viz.colors();
    const xs = Viz.scaleLinear(
      [0, Math.max(1, schedule.totalRadius * 1.04)],
      [plot.x0, plot.x1]
    );

    if (svg) svg.remove();
    svg = Viz.createSvg(body, W, H, {
      label:
        "A replayable cutaway of a growing plate edge, with radius increasing from left to right.",
      desc:
        "Only the portion grown by the selected schedule time is solid. Low-supersaturation " +
        "intervals slow outward growth and build underside ribs; restored growth leaves each rib behind.",
    });

    for (const dip of schedule.dips) {
      const visibleEnd = Math.min(dip.radiusEnd, state.visibleRadius);
      if (visibleEnd <= dip.radiusStart) continue;
      svg.appendChild(
        Viz.svgEl("rect", {
          x: xs(dip.radiusStart),
          y: plot.y1,
          width: Math.max(1, xs(visibleEnd) - xs(dip.radiusStart)),
          height: plot.y0 - plot.y1,
          fill: colors.series[1],
          "fill-opacity": 0.12,
        })
      );
    }

    const drawnRadius = Math.max(0.001, state.visibleRadius);
    const stepRadius = Math.max(0.1, schedule.totalRadius / 650);
    const points = [];
    for (let radius = 0; radius < drawnRadius; radius += stepRadius) {
      points.push([radius, thicknessAt(radius, schedule.dips)]);
    }
    points.push([drawnRadius, thicknessAt(drawnRadius, schedule.dips)]);

    let fillPath =
      "M " +
      xs(0).toFixed(1) +
      " " +
      topY.toFixed(1) +
      " L " +
      xs(drawnRadius).toFixed(1) +
      " " +
      topY.toFixed(1) +
      " ";
    for (let index = points.length - 1; index >= 0; index--) {
      fillPath +=
        "L " +
        xs(points[index][0]).toFixed(1) +
        " " +
        (topY + points[index][1]).toFixed(1) +
        " ";
    }
    fillPath += "Z";
    svg.appendChild(
      Viz.svgEl("path", {
        d: fillPath,
        fill: colors.series[0],
        "fill-opacity": 0.16,
        stroke: "none",
      })
    );

    svg.appendChild(
      Viz.svgEl("line", {
        x1: xs(0),
        x2: xs(drawnRadius),
        y1: topY,
        y2: topY,
        stroke: colors.series[0],
        "stroke-width": 2.2,
      })
    );

    let underside =
      "M " +
      xs(points[0][0]).toFixed(1) +
      " " +
      (topY + points[0][1]).toFixed(1) +
      " ";
    for (let index = 1; index < points.length; index++) {
      underside +=
        "L " +
        xs(points[index][0]).toFixed(1) +
        " " +
        (topY + points[index][1]).toFixed(1) +
        " ";
    }
    svg.appendChild(
      Viz.svgEl("path", {
        d: underside,
        fill: "none",
        stroke: colors.series[0],
        "stroke-width": 2.2,
        "stroke-linejoin": "round",
      })
    );

    svg.appendChild(
      Viz.svgEl("line", {
        x1: xs(state.visibleRadius),
        x2: xs(state.visibleRadius),
        y1: plot.y1,
        y2: plot.y0,
        stroke: colors.series[2],
        "stroke-width": 1.5,
        "stroke-dasharray": "4 4",
      })
    );

    const edgeLabel = Viz.svgEl("text", {
      class: "series-label",
      x: xs(state.visibleRadius),
      y: plot.y1 - 6,
      "text-anchor": "middle",
      fill: colors.series[2],
    });
    edgeLabel.textContent = "growing edge";
    svg.appendChild(edgeLabel);

    const topLabel = Viz.svgEl("text", {
      class: "series-label",
      x: xs(0),
      y: topY - 10,
      fill: colors.series[0],
    });
    topLabel.textContent = "top surface — stays flat";
    svg.appendChild(topLabel);

    Viz.axisBottom(svg, xs, {
      y: plot.y0,
      ticks: 5,
      title: "Radius grown outward from the centre (schematic units)",
      titleOffset: 34,
      format: function (value) {
        return Math.round(value);
      },
    });

    updateData(state);
    const activity =
      state.kind === "complete"
        ? "schedule complete"
        : state.kind === "dip"
        ? "low-supersaturation dip " + (state.dipIndex + 1) + " of " + DIP_COUNT
        : "restored thin-edge growth";
    status.textContent =
      "Schedule " +
      state.time.toFixed(0) +
      " of " +
      schedule.totalTime.toFixed(0) +
      " s: " +
      activity +
      ". Completed ribs: " +
      state.completedRibs +
      ". Clear gap " +
      schedule.clearGap.toFixed(1) +
      " + rib width " +
      schedule.ribWidth.toFixed(1) +
      " = " +
      schedule.crestSpacing.toFixed(1) +
      " crest-to-crest units.";
  }

  function markControl(control, name) {
    control.input.dataset.control = name;
    return control;
  }

  const depthControl = markControl(
    Viz.slider(controls, {
      label: "How far you drop supersaturation",
      id: "rib-depth-replay",
      min: 0.1,
      max: 1,
      step: 0.05,
      value: depth,
      format: function (value) {
        return Math.round(value * 100) + "%";
      },
      onInput: function (value) {
        depth = value;
        resetForConfiguration();
      },
    }),
    "dip-depth"
  );

  const durationControl = markControl(
    Viz.slider(controls, {
      label: "How long you hold it",
      id: "rib-duration-replay",
      min: 10,
      max: 60,
      step: 5,
      value: duration,
      format: function (value) {
        return value + " s";
      },
      onInput: function (value) {
        duration = value;
        resetForConfiguration();
      },
    }),
    "dip-duration"
  );

  const intervalControl = markControl(
    Viz.slider(controls, {
      label: "Restored growth time between dips",
      id: "rib-interval-replay",
      min: 20,
      max: 100,
      step: 5,
      value: interval,
      format: function (value) {
        return value + " s";
      },
      onInput: function (value) {
        interval = value;
        resetForConfiguration();
      },
    }),
    "restored-interval"
  );

  schedule = computeSchedule(depth, duration, interval);

  const scrubber = markControl(
    Viz.slider(controls, {
      label: "Schedule clock",
      id: "rib-clock-replay",
      min: 0,
      max: schedule.totalTime,
      step: 1,
      value: 0,
      format: function (value) {
        return Math.round(value) + " s";
      },
      onInput: function (value) {
        if (internalScrubUpdate || !playback) return;
        playback.pause();
        playback.seek((value / schedule.totalTime) * DISPLAY_SECONDS);
        syncPlaybackButton();
      },
    }),
    "schedule-clock"
  );

  const playButton = Viz.button(controls, "Pause schedule", function () {
    if (playback.time >= DISPLAY_SECONDS) {
      playback.pause();
      playback.seek(0);
      playback.play();
    } else if (playback.isPlaybackRequested) {
      playback.pause();
    } else {
      playback.play();
    }
    syncPlaybackButton();
  });
  playButton.dataset.control = "play-pause";

  const restartButton = Viz.button(controls, "Restart schedule", function () {
    playback.seek(0);
    if (!motionPreference.matches) playback.play();
    syncPlaybackButton();
  });
  restartButton.dataset.control = "restart";

  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

  function setScrubber(time) {
    internalScrubUpdate = true;
    scrubber.input.max = schedule.totalTime;
    scrubber.input.value = clamp(time, 0, schedule.totalTime);
    const output = scrubber.element.querySelector("output");
    output.textContent = Math.round(time) + " s";
    scrubber.input.setAttribute("aria-valuetext", output.textContent);
    internalScrubUpdate = false;
  }

  function syncPlaybackButton() {
    if (!playback) return;
    if (motionPreference.matches) {
      playButton.disabled = true;
      playButton.textContent = "Use the schedule clock";
      playButton.setAttribute("aria-pressed", "false");
      return;
    }
    playButton.disabled = false;
    if (playback.time >= DISPLAY_SECONDS) {
      playButton.textContent = "Replay schedule";
      playButton.setAttribute("aria-pressed", "false");
    } else {
      playButton.textContent = playback.isPlaybackRequested
        ? "Pause schedule"
        : "Play schedule";
      playButton.setAttribute("aria-pressed", String(playback.isPlaybackRequested));
    }
  }

  function resetForConfiguration() {
    schedule = computeSchedule(depth, duration, interval);
    if (!playback) {
      render(0);
      setScrubber(0);
      return;
    }
    playback.pause();
    playback.seek(0);
    setScrubber(0);
    syncPlaybackButton();
  }

  buildLegend();
  render(0);

  playback = Viz.animate(
    root,
    function (displayTime) {
      const fraction = clamp(displayTime / DISPLAY_SECONDS, 0, 1);
      const nextScheduleTime = fraction * schedule.totalTime;
      render(nextScheduleTime);
      setScrubber(nextScheduleTime);
      syncPlaybackButton();
    },
    {
      duration: DISPLAY_SECONDS,
      loop: false,
      staticAt: DISPLAY_SECONDS * 0.6,
      controls: false,
    }
  );

  function applyMotionPreference() {
    if (motionPreference.matches && playback) playback.pause();
    syncPlaybackButton();
  }

  motionPreference.addEventListener("change", applyMotionPreference);
  applyMotionPreference();

  Viz.onThemeChange(function () {
    buildLegend();
    render(scheduleTime);
  });

  window.EducationTestHooks = window.EducationTestHooks || {};
  window.EducationTestHooks.ribSchedule = Object.freeze({
    computeSchedule: computeSchedule,
    stateAt: stateAt,
  });

  void depthControl;
  void durationControl;
  void intervalControl;
})();
