"""Render saved JSON comparisons; requires matplotlib. No simulation or fitting."""
import json
from pathlib import Path
import sys

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

root = Path(__file__).resolve().parent
destination = Path(sys.argv[1]) if len(sys.argv) > 1 else root / "structure-and-growth.png"
pressure = json.loads((root / "pressure.json").read_text())
cold = json.loads((root / "cold.json").read_text())
history = json.loads((root / "history.json").read_text())
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10,
                     "axes.titlepad": 25,
                     "axes.spines.top": False, "axes.spines.right": False})
fig, axes = plt.subplots(2, 2, figsize=(13.8, 10.2))
colors = ["#007D8A", "#DC8B22", "#7546A3"]
for ax, group in zip(axes[0], pressure["groups"]):
    for color, row in zip(colors, group["rows"]):
        profile = row["endpoint"]["profile"]
        ax.plot([p["offset"] * row["row"]["dxUm"] for p in profile["layers"]],
                [p["attachedCount"] for p in profile["layers"]], "o-", ms=4,
                color=color, label=f'{row["row"]["pressurePa"] / 101325:g} atm')
    ax.set_title(f'Pressure: forcing fraction {group["fraction"]:.2f}', loc="left", weight="bold")
    ax.set_xlabel("Axial coordinate from seed center (µm)")
    ax.set_ylabel("Attached sites in an axial plane")
    ax.grid(axis="y", color="#E5E8EB")
    ax.legend(frameon=False)
    ax.text(0, 1.015, "−6 °C, both-dip; size-21 endpoints at different ages", transform=ax.transAxes,
            color="#5D6570", fontsize=9)

ax = axes[1, 0]
for group, color, marker in zip(cold["groups"], ["#007D8A", "#DC8B22"], ["o", "s"]):
    stages, contrast = [], []
    for stage in group["stages"]:
        selection = next(s for s in stage["selections"] if s["fractionOfShortestPlateau"] == .5)
        gaps = {r["arm"]: r["atOrBefore"]["gap"] for r in selection["rows"]}
        stages.append(stage["tip"])
        contrast.append(gaps["prism-only"] - gaps["neither"])
    ax.plot(stages, contrast, marker=marker, color=color, ms=6,
            label=f'{group["tempC"]:g} °C')
ax.set_title("Cold: prism contrast depends on growth stage", loc="left", weight="bold")
ax.set_xlabel("Central-plane tip hex radius (lattice cells)")
ax.set_ylabel("Prism-only − neither core-to-tip gap (cells)")
ax.set_yticks([0, 1, 2])
ax.grid(axis="y", color="#E5E8EB")
ax.legend(frameon=False)
ax.text(0, 1.015, "Fraction .10; half shortest common tip-plateau duration", transform=ax.transAxes,
        color="#5D6570", fontsize=9)

ax = axes[1, 1]
groups = [g for g in history["history"] if g["paramSet"] == "M1"]
for group, color, shift in zip(groups, ["#007D8A", "#DC8B22"], [-.18, .18]):
    vals = [r["windows"]["full"]["atOrBeforeIncrements"]["axialCenterSpanUm"] for r in group["rows"]]
    duration = group["commonPostEventSeconds"]
    direction = "Cooling" if group["fromTempC"] > group["toTempC"] else "Warming"
    positions = [i + shift for i in range(len(vals))]
    bars = ax.bar(positions, vals, width=.34, color=color,
                  label=f"{direction}: {duration:.3f} s after switch")
    ax.bar_label(bars, labels=[f"{v:.2f}" for v in vals], padding=3, fontsize=9)
ax.set_title("History: new axial growth after switching", loc="left", weight="bold")
ax.set_xticks([0, 1, 2], ["7", "11", "15"])
ax.set_xlabel("Maximum extent that triggered temperature switch (cells)")
ax.set_ylabel("Added total axial span (µm)")
ax.set_ylim(0, 4.6)
ax.legend(frameon=False, loc="upper right", fontsize=9)
ax.text(0, 1.015, "M1; common duration within each direction, not between them", transform=ax.transAxes,
        color="#5D6570", fontsize=9)
fig.suptitle("Saved runs reveal structure and growth-stage effects", fontsize=19,
             weight="bold", x=.065, ha="left", y=.98)
fig.text(.065, .936, "HIL + BLD  •  N64, spacing 0.35 µm  •  Retrospective model-development observations",
         fontsize=11, color="#5D6570")
fig.text(.065, .025,
         "Counts describe attached occupancy, not total mass. Cold radii are hex-coordinate distances.\n"
         "Lines connect selected observations; they do not imply continuous bounds. No physical validation or grid independence.",
         fontsize=9, color="#5D6570")
fig.subplots_adjust(left=.08, right=.97, top=.855, bottom=.115, hspace=.43, wspace=.29)
fig.savefig(destination, dpi=180, facecolor="white")
print(destination)
