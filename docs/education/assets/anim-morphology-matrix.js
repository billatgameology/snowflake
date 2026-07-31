/* ==========================================================================
   Morphology-matrix browser

   This browser does not classify photographs or invent missing metadata. It
   selects one source page, names the requested cell, and lets the reader zoom
   and pan the published plate. The source figures remain ordinary
   figure[data-src] elements so site.js can show local images in the offline
   build and rights-aware source placeholders on the public site.
   ======================================================================= */
(function () {
  "use strict";

  function init() {
    const root = document.getElementById("anim-morphology-matrix");
    if (!root || root.dataset.matrixReady === "true") return;

    const body = root.querySelector("[data-matrix-plate-host]");
    const controls = root.querySelector(".anim__controls");
    const plates = Array.from(document.querySelectorAll("[data-matrix-source-plate]"));
    if (!body || !controls || !plates.length) return;

    root.dataset.matrixReady = "true";

    const DATASETS = {
      tax1: {
        label: "TAX1 Figure 24 — 97 qualitative snapshots",
        temperatures: [-0.5, -1, -2, -3, -4, -5, -6, -7, -8, -9, -10, -11,
          -12, -13, -14, -15, -16, -17, -18, -21],
        supersaturations: [128, 64, 32, 16, 8],
        initialTemperature: -5,
        initialSupersaturation: 32,
      },
      tax2: {
        label: "TAX2 Figure 2 — 206 timed observations",
        temperatures: [-0.5, -1, -2, -3, -4, -4.5, -5, -6, -7, -8, -9, -10,
          -11, -12, -13, -14, -15, -16, -17, -18, -19, -20, -22, -24],
        supersaturations: [150, 100, 70, 45, 30, 20, 15, 10, 7],
        initialTemperature: -5,
        initialSupersaturation: 150,
      },
    };

    const KNOWN_TAX2_METADATA = {
      "-5|150": { time: "130 seconds", field: "1032 µm" },
      "-4.5|150": { time: "54 seconds", field: "789 µm", note: "shortest published time in the matrix" },
      "-12|10": { time: "1334 seconds", field: "314 µm", note: "longest published time in the matrix" },
      "-16|100": { time: "278 seconds", field: "2026 µm", note: "largest published field of view" },
      "-22|15": { time: "266 seconds", field: "164 µm", note: "smallest published field of view" },
    };

    const TAX1_NOTES = {
      "-5|8": "The source caption identifies a hollow column at this condition.",
      "-5|16": "The source caption identifies needle growth at this condition.",
      "-5|32": "The source caption identifies a three-pronged form at this condition.",
      "-5|64": "This high-supply part of the −5 °C column shows strongly branched columnar growth.",
      "-5|128": "This high-supply part of the −5 °C column shows fishbone-like dendritic growth.",
    };

    const state = {
      dataset: "tax1",
      temperature: DATASETS.tax1.initialTemperature,
      supersaturation: DATASETS.tax1.initialSupersaturation,
      zoom: 1,
      currentPlate: null,
    };

    function makeSelect(labelText, hook) {
      const label = document.createElement("label");
      label.style.display = "grid";
      label.style.gap = "0.25rem";
      label.style.minWidth = "11rem";

      const text = document.createElement("span");
      text.textContent = labelText;
      text.style.fontWeight = "650";
      text.style.fontSize = "0.82rem";

      const select = document.createElement("select");
      select.setAttribute("data-test-hook", hook);
      select.style.font = "inherit";
      select.style.padding = "0.45rem 0.55rem";
      select.style.border = "1px solid var(--rule)";
      select.style.borderRadius = "0.35rem";
      select.style.color = "var(--ink)";
      select.style.background = "var(--surface)";

      label.appendChild(text);
      label.appendChild(select);
      controls.appendChild(label);
      return select;
    }

    const datasetSelect = makeSelect("Published matrix", "matrix-dataset");
    const temperatureSelect = makeSelect("Temperature", "matrix-temperature");
    const supersaturationSelect = makeSelect("Far-field supersaturation", "matrix-supersaturation");
    datasetSelect.dataset.control = "matrix-dataset";
    temperatureSelect.dataset.control = "matrix-temperature-c";
    supersaturationSelect.dataset.control = "matrix-sigma-infinity-percent";

    Object.keys(DATASETS).forEach(function (key) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = DATASETS[key].label;
      datasetSelect.appendChild(option);
    });

    const status = document.createElement("div");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.setAttribute("data-test-hook", "matrix-selection-status");
    status.style.margin = "0.8rem 0 0";
    status.style.padding = "0.8rem";
    status.style.border = "1px solid var(--rule)";
    status.style.borderRadius = "0.4rem";
    status.style.background = "var(--sunken)";
    root.querySelector(".anim__head").appendChild(status);

    const detail = document.createElement("dl");
    detail.setAttribute("data-test-hook", "matrix-metadata");
    detail.style.display = "grid";
    detail.style.gridTemplateColumns = "max-content 1fr";
    detail.style.gap = "0.25rem 0.75rem";
    detail.style.margin = "0";

    const zoomReadout = document.createElement("span");
    zoomReadout.setAttribute("role", "status");
    zoomReadout.setAttribute("aria-live", "polite");
    zoomReadout.setAttribute("data-test-hook", "matrix-zoom-status");
    zoomReadout.style.alignSelf = "center";
    zoomReadout.style.fontVariantNumeric = "tabular-nums";

    function addDefinition(term, value) {
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = term;
      dt.style.fontWeight = "650";
      dd.textContent = value;
      dd.style.margin = "0";
      detail.appendChild(dt);
      detail.appendChild(dd);
    }

    function temperatureLabel(value) {
      return (value < 0 ? "−" + Math.abs(value) : value) + " °C";
    }

    function refill(select, values, formatter) {
      select.textContent = "";
      values.forEach(function (value) {
        const option = document.createElement("option");
        option.value = String(value);
        option.textContent = formatter(value);
        select.appendChild(option);
      });
    }

    function configureDataset(resetSelection) {
      const dataset = DATASETS[state.dataset];
      if (resetSelection) {
        state.temperature = dataset.initialTemperature;
        state.supersaturation = dataset.initialSupersaturation;
      }
      refill(temperatureSelect, dataset.temperatures, temperatureLabel);
      refill(supersaturationSelect, dataset.supersaturations, function (value) {
        return value + " %";
      });
      datasetSelect.value = state.dataset;
      temperatureSelect.value = String(state.temperature);
      supersaturationSelect.value = String(state.supersaturation);
    }

    function plateTemperatures(plate) {
      return plate.dataset.temperatures.split(",").map(Number);
    }

    function selectPlateElement(dataset, temperature) {
      return plates.find(function (plate) {
        return plate.dataset.matrixDataset === dataset &&
          plateTemperatures(plate).includes(temperature);
      }) || null;
    }

    function findPlate() {
      return selectPlateElement(state.dataset, state.temperature);
    }

    function missingCell(dataset, temperature, supersaturation) {
      if (!DATASETS[dataset]) {
        throw new RangeError("Unknown morphology matrix: " + dataset);
      }
      if (dataset === "tax1") {
        if (temperature === -0.5 && supersaturation === 128) {
          return "No photograph: growth was so fast under this warm, high-supply condition that the ice melted.";
        }
        if ((temperature === -18 || temperature === -21) && supersaturation === 128) {
          return "No photograph: the linear diffusion chamber could not reach this high a supersaturation at the low temperature.";
        }
      }
      if (dataset === "tax2") {
        const knownBlanks = [
          "-0.5|150", "-1|150", "-2|150", "-0.5|100",
          "-18|150", "-19|150", "-20|150", "-22|150", "-24|150", "-24|100",
        ];
        if (knownBlanks.includes(temperature + "|" + supersaturation)) {
          return "This grid position is blank. Ten blanks are inferred by reconciling the 24 × 9 layout with the paper's stated 206 observations; the paper does not print a separate explanation for each blank.";
        }
      }
      return "";
    }

    function matrixMetadata(dataset, temperature, supersaturation) {
      if (!DATASETS[dataset]) {
        throw new RangeError("Unknown morphology matrix: " + dataset);
      }
      const missing = missingCell(dataset, temperature, supersaturation);
      const result = {
        "Selected cell": temperatureLabel(temperature) + ", " +
          supersaturation + " % far-field supersaturation",
      };

      if (dataset === "tax1") {
        result["Seed and view"] = "One basal facet at the tip of a slender c-axis ice needle; transmitted-light 2D projection.";
        result["Growth time"] = "Not published per cell in Figure 24.";
        result["Physical scale"] = "Not published per cell in Figure 24.";
        result["What this cell is"] = missing || TAX1_NOTES[temperature + "|" + supersaturation] ||
          "A qualitative representative snapshot; this browser does not assign a new morphology label.";
        result["Selection limit"] = "One selected image is not a frequency distribution or a growth history. The needle perturbs diffusion and breaks top/bottom symmetry.";
      } else {
        const known = KNOWN_TAX2_METADATA[temperature + "|" + supersaturation];
        result["Seed and view"] = "One basal facet at the tip of a slender c-axis ice needle; focus-stacked 2D projection.";
        result["Growth time"] = missing ? "No observation in this grid position." :
          known ? known.time : "Printed inside the selected source tile; zoom the plate to read it.";
        result["Physical scale"] = missing ? "No observation in this grid position." :
          known ? known.field + " field-of-view width" :
            "Printed inside the selected source tile; zoom the plate to read it.";
        result["What this cell is"] = missing || (known && known.note) ||
          "One representative selected from several crystals; no automatic morphology label is added here.";
        result["Measurement limit"] = "Temperature uncertainty is typically ±0.2 °C; stated supersaturation may be 0.8–1.2 times the label and comes from chamber modelling.";
        result["Selection limit"] = "The author preferred symmetric, well-formed crystals on isolated needles. The 206 panels are therefore a validation set, not a population census.";
      }
      return result;
    }

    function updateStatus() {
      detail.textContent = "";
      const metadata = matrixMetadata(state.dataset, state.temperature, state.supersaturation);
      Object.keys(metadata).forEach(function (key) {
        addDefinition(key, metadata[key]);
      });
      status.textContent = "";
      status.appendChild(detail);
    }

    let zoomOutButton;
    let zoomInButton;
    let resetViewButton;

    function applyZoom() {
      const plate = state.currentPlate;
      if (!plate) return;
      const frame = plate.querySelector(".figure__frame");
      const image = plate.querySelector("img");
      const imageAvailable = Boolean(frame && image);
      root.dataset.sourceImageAvailable = String(imageAvailable);

      [zoomOutButton, zoomInButton, resetViewButton].forEach(function (button) {
        if (!button) return;
        button.disabled = !imageAvailable;
        button.setAttribute("aria-disabled", String(!imageAvailable));
        button.title = imageAvailable
          ? "Zoom and pan the locally available source image"
          : "The public edition provides a cited source card but does not redistribute this image";
      });
      if (zoomInButton) {
        zoomInButton.textContent = imageAvailable ? "Zoom in" : "Zoom unavailable — source card only";
      }

      if (frame) {
        frame.style.maxHeight = state.zoom > 1 ? "42rem" : "";
        frame.style.overflow = state.zoom > 1 ? "auto" : "";
        frame.setAttribute("tabindex", "0");
        frame.setAttribute("aria-label",
          "Published source plate. Use the zoom controls, then scroll this region to inspect the selected cell.");
      }
      if (image) {
        image.style.width = (state.zoom * 100) + "%";
        image.style.maxWidth = "none";
        image.style.height = "auto";
        if (image.dataset.matrixZoomWatch !== "true") {
          image.dataset.matrixZoomWatch = "true";
          image.addEventListener("error", function () {
            setTimeout(applyZoom, 0);
          }, { once: true });
        }
      }
      root.dataset.matrixZoom = state.zoom.toFixed(2);
      zoomReadout.textContent = imageAvailable
        ? Math.round(state.zoom * 100) + "%"
        : "Source image is available only in the offline edition";
    }

    function render() {
      plates.forEach(function (plate) {
        plate.hidden = true;
        plate.setAttribute("aria-hidden", "true");
      });

      state.currentPlate = findPlate();
      if (state.currentPlate) {
        state.currentPlate.hidden = false;
        state.currentPlate.removeAttribute("aria-hidden");
        body.appendChild(state.currentPlate);
      }

      root.dataset.selectedDataset = state.dataset;
      root.dataset.selectedTemperature = String(state.temperature);
      root.dataset.selectedSupersaturation = String(state.supersaturation);
      root.dataset.selectedCellMissing = String(Boolean(
        missingCell(state.dataset, state.temperature, state.supersaturation)
      ));
      state.zoom = 1;
      updateStatus();
      applyZoom();
    }

    datasetSelect.addEventListener("change", function () {
      state.dataset = datasetSelect.value;
      configureDataset(true);
      render();
    });
    temperatureSelect.addEventListener("change", function () {
      state.temperature = Number(temperatureSelect.value);
      render();
    });
    supersaturationSelect.addEventListener("change", function () {
      state.supersaturation = Number(supersaturationSelect.value);
      render();
    });

    zoomOutButton = Viz.button(controls, "Zoom out", function () {
      state.zoom = Math.max(1, state.zoom - 0.5);
      applyZoom();
    });
    zoomOutButton.dataset.control = "matrix-zoom-out";
    zoomInButton = Viz.button(controls, "Zoom in", function () {
      state.zoom = Math.min(4, state.zoom + 0.5);
      applyZoom();
    });
    zoomInButton.dataset.control = "matrix-zoom-in";
    resetViewButton = Viz.button(controls, "Reset view", function () {
      state.zoom = 1;
      applyZoom();
      const frame = state.currentPlate && state.currentPlate.querySelector(".figure__frame");
      if (frame) {
        frame.scrollLeft = 0;
        frame.scrollTop = 0;
      }
    });
    resetViewButton.dataset.control = "matrix-zoom-reset";
    controls.appendChild(zoomReadout);

    function datasetInventory() {
      const datasets = {};
      Object.keys(DATASETS).forEach(function (key) {
        const source = DATASETS[key];
        datasets[key] = {
          label: source.label,
          temperatures: source.temperatures.slice(),
          supersaturations: source.supersaturations.slice(),
          observationCount: key === "tax1" ? 97 : 206,
          missingCellCount: key === "tax1" ? 3 : 10,
        };
      });
      return {
        datasets: datasets,
        plates: plates.map(function (plate) {
          return {
            dataset: plate.dataset.matrixDataset,
            temperatures: plateTemperatures(plate),
            source: plate.getAttribute("data-src"),
            figure: plate.getAttribute("data-figure"),
            page: plate.getAttribute("data-page"),
          };
        }),
      };
    }

    function selectPlate(dataset, temperature) {
      const plate = selectPlateElement(dataset, Number(temperature));
      if (!plate) return null;
      return {
        dataset: plate.dataset.matrixDataset,
        temperatures: plateTemperatures(plate),
        source: plate.getAttribute("data-src"),
        figure: plate.getAttribute("data-figure"),
        page: plate.getAttribute("data-page"),
      };
    }

    window.EducationTestHooks = window.EducationTestHooks || {};
    window.EducationTestHooks.morphologyMatrix = Object.freeze({
      inventory: datasetInventory,
      selectPlate: selectPlate,
      missingCell: missingCell,
      metadata: matrixMetadata,
    });

    configureDataset(false);
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
