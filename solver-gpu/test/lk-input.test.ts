import { hexDistance } from "@vcc/core";
import { describe, expect, it } from "vitest";
import {
  createGpuGridLayout,
  GPU_LK_TOPOLOGY_BOUNDARY,
  GPU_LK_TOPOLOGY_FAR_FIELD,
  validateGpuLkDomainTopology,
} from "../src/index.ts";

function domainMasks(
  dims: { readonly nx: number; readonly ny: number; readonly nz: number },
  domain: "box" | "hexPrism",
  farField: "dirichlet" | "reflecting",
) {
  const layout = createGpuGridLayout(dims);
  const center = [
    Math.floor(dims.nx / 2),
    Math.floor(dims.ny / 2),
    Math.floor(dims.nz / 2),
  ] as const;
  const wall = new Uint32Array(layout.cellCount);
  const topology = new Uint32Array(layout.cellCount);
  const radius = Math.min(
    center[0],
    dims.nx - 1 - center[0],
    center[1],
    dims.ny - 1 - center[1],
  );
  const halfZ = Math.min(center[2], dims.nz - 1 - center[2]);
  for (let index = 0; index < layout.cellCount; index++) {
    const k = Math.floor(index / layout.plane);
    const remainder = index - k * layout.plane;
    const j = Math.floor(remainder / dims.nx);
    const i = remainder - j * dims.nx;
    const distance = hexDistance(i - center[0], j - center[1]);
    const active =
      domain === "box" ||
      (distance <= radius && Math.abs(k - center[2]) <= halfZ);
    wall[index] = active ? 0 : 1;
    const shell =
      domain === "box"
        ? i === 0 ||
          i === dims.nx - 1 ||
          j === 0 ||
          j === dims.ny - 1 ||
          k === 0 ||
          k === dims.nz - 1
        : active &&
          (distance === radius || Math.abs(k - center[2]) === halfZ);
    if (farField === "dirichlet" && shell) {
      topology[index] |= GPU_LK_TOPOLOGY_FAR_FIELD;
    }
  }
  return { layout, center, wall, topology };
}

describe("GPU LK exact domain topology", () => {
  it.each([
    ["box", "dirichlet"],
    ["box", "reflecting"],
    ["hexPrism", "dirichlet"],
    ["hexPrism", "reflecting"],
  ] as const)("accepts the exact %s/%s masks", (domain, farField) => {
    const input = domainMasks(
      { nx: 7, ny: 9, nz: 5 },
      domain,
      farField,
    );
    expect(() =>
      validateGpuLkDomainTopology(
        input.layout,
        input.wall,
        input.topology,
        domain,
        farField,
        input.center,
      ),
    ).not.toThrow();
  });

  it("rejects missing, extra, reflecting, overlapping, and wrong-wall masks", () => {
    const baseline = domainMasks(
      { nx: 7, ny: 9, nz: 5 },
      "hexPrism",
      "dirichlet",
    );
    const shellIndex = baseline.topology.findIndex(
      (value) => (value & GPU_LK_TOPOLOGY_FAR_FIELD) !== 0,
    );
    const interiorIndex = baseline.topology.findIndex(
      (value, index) => value === 0 && baseline.wall[index] === 0,
    );
    expect(shellIndex).toBeGreaterThanOrEqual(0);
    expect(interiorIndex).toBeGreaterThanOrEqual(0);

    const missing = baseline.topology.slice();
    missing[shellIndex] &= ~GPU_LK_TOPOLOGY_FAR_FIELD;
    expect(() =>
      validateGpuLkDomainTopology(
        baseline.layout,
        baseline.wall,
        missing,
        "hexPrism",
        "dirichlet",
        baseline.center,
      ),
    ).toThrow(/far-field/);

    const extra = baseline.topology.slice();
    extra[interiorIndex] |= GPU_LK_TOPOLOGY_FAR_FIELD;
    expect(() =>
      validateGpuLkDomainTopology(
        baseline.layout,
        baseline.wall,
        extra,
        "hexPrism",
        "dirichlet",
        baseline.center,
      ),
    ).toThrow(/far-field/);

    expect(() =>
      validateGpuLkDomainTopology(
        baseline.layout,
        baseline.wall,
        baseline.topology,
        "hexPrism",
        "reflecting",
        baseline.center,
      ),
    ).toThrow(/far-field/);

    const overlap = baseline.topology.slice();
    overlap[shellIndex] |= GPU_LK_TOPOLOGY_BOUNDARY;
    expect(() =>
      validateGpuLkDomainTopology(
        baseline.layout,
        baseline.wall,
        overlap,
        "hexPrism",
        "dirichlet",
        baseline.center,
      ),
    ).toThrow(/overlap/);

    const wrongWall = baseline.wall.slice();
    wrongWall[interiorIndex] = 1;
    expect(() =>
      validateGpuLkDomainTopology(
        baseline.layout,
        wrongWall,
        baseline.topology,
        "hexPrism",
        "dirichlet",
        baseline.center,
      ),
    ).toThrow(/wall mask/);
  });
});
