import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { growthTourFramingSpan } from "../src/gutcheck-growth-framing.ts";
import { RUN_B_GROWTH_PRESENTATION, sampleSceneCamera } from "../src/gutcheck-scene-motion.ts";

// A flat Run B-sized bounding box; the actual replay's measured bounds are checked
// by the browser capture. These fixtures exercise the camera/projection boundary.
const bounds = {
  min: { x: -294, y: -255, z: -6 },
  max: { x: 294, y: 255, z: 6 },
};

function projectedCorners(span: number, aspect: number, seconds: number): THREE.Vector3[] {
  const pose = sampleSceneCamera(RUN_B_GROWTH_PRESENTATION.motion.camera, seconds);
  const halfWidth = span * Math.max(1, aspect);
  const halfHeight = span * Math.max(1, 1 / aspect);
  const camera = new THREE.OrthographicCamera(-halfWidth, halfWidth, halfHeight, -halfHeight, 0.01, 3000);
  const tilt = pose.tilt * Math.PI / 180;
  const yaw = pose.yaw * Math.PI / 180;
  camera.position.set(0, Math.sin(tilt) * 1240, Math.cos(tilt) * 1240);
  camera.position.applyAxisAngle(new THREE.Vector3(0, 0, 1), yaw);
  camera.up.set(0, 1, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), yaw);
  camera.zoom = pose.zoom;
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  const corners: THREE.Vector3[] = [];
  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) corners.push(new THREE.Vector3(x, y, z).project(camera));
    }
  }
  return corners;
}

describe("compact authored-tour framing", () => {
  it("reproduces the old middle-pose clipping and contains the tour at wide/narrow viewport aspects", () => {
    expect(projectedCorners(310 * 1.12, 1.6, 6.5).some((corner) => Math.abs(corner.y) > 1)).toBe(true);
    const span = growthTourFramingSpan(310, bounds, 1.25);
    for (const aspect of [1.6, 1, 390 / 844]) {
      for (const seconds of [0, 3, 6, 6.5, 8.5, 11, 13, 14.5, 15.5, 16]) {
        for (const corner of projectedCorners(span, aspect, seconds)) {
          expect(Math.abs(corner.x)).toBeLessThan(0.9);
          expect(Math.abs(corner.y)).toBeLessThan(0.9);
        }
      }
    }
  });

  it("keeps the source span as a floor and includes the farthest signed corner", () => {
    const small = { min: { x: -1, y: -2, z: -3 }, max: { x: 1, y: 2, z: 3 } };
    expect(growthTourFramingSpan(310, small, 1.25)).toBe(310 * 1.12);
    const asymmetric = { min: { x: -3, y: -4, z: 0 }, max: { x: 1, y: 2, z: 0 } };
    expect(growthTourFramingSpan(1, asymmetric, 2)).toBeCloseTo(11.2, 12);
    expect(() => growthTourFramingSpan(310, bounds, Number.NaN)).toThrow(/finite bounds/);
  });
});
