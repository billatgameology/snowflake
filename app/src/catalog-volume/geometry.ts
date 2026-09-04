import * as THREE from "three";

import type { GrowthSceneComponentV1 } from "../growth-scene.ts";

export const CATALOG_VOLUME_Z_SCALE = 3.5;

export interface CatalogVolumeGeometry {
  readonly size: readonly [number, number, number];
  readonly crop: {
    readonly iMin: number;
    readonly jMin: number;
    readonly kMin: number;
  };
  readonly center: readonly [number, number, number];
  readonly decimation: number;
}

export const catalogVolumeMatrix = (volume: CatalogVolumeGeometry): THREE.Matrix4 => {
  const [sizeI, sizeJ, sizeK] = volume.size;
  const [centerI, centerJ, centerK] = volume.center;
  const iSpan = Math.max(1, (sizeI - 1) * volume.decimation);
  const jSpan = Math.max(1, (sizeJ - 1) * volume.decimation);
  const kSpan = Math.max(1, sizeK - 1);
  const startI = volume.crop.iMin - centerI;
  const startJ = volume.crop.jMin - centerJ;
  const startK = volume.crop.kMin - centerK;
  return new THREE.Matrix4().set(
    iSpan, jSpan / 2, 0, startI + startJ / 2,
    0, jSpan * Math.sqrt(3) / 2, 0, startJ * Math.sqrt(3) / 2,
    0, 0, kSpan * CATALOG_VOLUME_Z_SCALE, startK * CATALOG_VOLUME_Z_SCALE,
    0, 0, 0, 1,
  );
};

export const catalogComponentMatrix = (component: GrowthSceneComponentV1): THREE.Matrix4 => {
  const transform = component.transform;
  const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(
    THREE.MathUtils.degToRad(transform.rotateDegrees[0]),
    THREE.MathUtils.degToRad(transform.rotateDegrees[1]),
    THREE.MathUtils.degToRad(transform.rotateDegrees[2]),
    "XYZ",
  ));
  return new THREE.Matrix4().compose(
    new THREE.Vector3(...transform.translate),
    quaternion,
    new THREE.Vector3(transform.scale, transform.scale, transform.scale),
  );
};

export const catalogCameraDirection = (yawDegrees: number, tiltDegrees: number): THREE.Vector3 => {
  const tilt = THREE.MathUtils.degToRad(tiltDegrees);
  const yaw = THREE.MathUtils.degToRad(yawDegrees);
  const horizontal = Math.sin(tilt);
  return new THREE.Vector3(
    -Math.sin(yaw) * horizontal,
    Math.cos(yaw) * horizontal,
    Math.cos(tilt),
  ).normalize();
};

export const catalogCameraUp = (yawDegrees: number, tiltDegrees: number): THREE.Vector3 => {
  const tilt = THREE.MathUtils.degToRad(tiltDegrees);
  const yaw = THREE.MathUtils.degToRad(yawDegrees);
  return new THREE.Vector3(
    Math.sin(yaw) * Math.cos(tilt),
    -Math.cos(yaw) * Math.cos(tilt),
    Math.sin(tilt),
  ).normalize();
};
