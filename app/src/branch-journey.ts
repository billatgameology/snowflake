import type { DendriteData } from "./dendrite-data.ts";
import type { StudyFrame } from "./three-views.ts";

export interface BranchJourney {
  origin: [number, number, number];
  extent: number;
  tips: Float64Array;
}

/** Presentation camera track along one branch, using its recorded advancing extremity. */
export function buildBranchJourney(data: DendriteData, frame: StudyFrame): BranchJourney {
  const origin = frame.center;
  const direction = frame.detail.map((value, axis) => value - origin[axis]!);
  const length = Math.hypot(...direction);
  if (length < 1e-6) direction[data.vertical ? 2 : 0] = 1;
  const norm = Math.hypot(...direction);
  for (let axis = 0; axis < 3; axis++) direction[axis] = direction[axis]! / norm;
  const tips = new Float64Array(257 * 3);
  let event = 0, furthest = 0, nearestAxis = Infinity, tip = [...origin];
  for (let sample = 0; sample <= 256; sample++) {
    const time = sample / 256 * data.finalTick;
    while (event < data.eventCount && data.ticks[event]! <= time) {
      const i = event++ * 3;
      const x = data.positions[i]! - origin[0], y = data.positions[i + 1]! - origin[1], z = data.positions[i + 2]! - origin[2];
      const along = x * direction[0]! + y * direction[1]! + z * direction[2]!;
      const across = Math.max(0, x * x + y * y + z * z - along * along);
      if (along >= 0 && across <= (along * .28 + 1.5) ** 2
        && (along > furthest || along === furthest && across < nearestAxis)) {
        furthest = along; nearestAxis = across;
        tip = [data.positions[i]!, data.positions[i + 1]!, data.positions[i + 2]!];
      }
    }
    tips.set(tip, sample * 3);
  }
  // Smooth only camera targets. The event geometry and exact visibility threshold are untouched.
  for (let pass = 0; pass < 3; pass++) {
    const source = tips.slice();
    for (let sample = 1; sample < 256; sample++) for (let axis = 0; axis < 3; axis++) {
      const i = sample * 3 + axis;
      tips[i] = (source[i - 3]! + 2 * source[i]! + source[i + 3]!) / 4;
    }
  }
  return { origin: [...origin], extent: data.extent, tips };
}

const ease = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

/** A seekable camera pose: approach the center, move out along the branch, orbit its tip. */
export function journeyPose(path: BranchJourney, progress: number) {
  const at = Math.max(0, Math.min(1, progress)), sample = Math.min(255, Math.floor(at * 256)), mix = at * 256 - sample;
  const approach = ease(at / .24), travel = ease((at - .22) / .46), orbit = ease((at - .68) / .32);
  const center = path.origin.map((value, axis) => {
    const tip = path.tips[sample * 3 + axis]! * (1 - mix) + path.tips[(sample + 1) * 3 + axis]! * mix;
    return value + (tip - value) * travel;
  });
  return {
    center, span: Math.max(2, path.extent * (1.16 - 1.02 * approach) * (1 - .2 * orbit)),
    tilt: .08 + .78 * approach + .12 * Math.sin(orbit * Math.PI * 2),
    yaw: -.4 + orbit * Math.PI * 2,
    stage: at < .24 ? "ZOOM INTO THE CENTER" : at < .68 ? "FOLLOW THE BRANCH" : "CIRCLE THE TIP",
  };
}
