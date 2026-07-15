// Counter-based seeded PRNG (charter §3.1; plan, Scaffold step 3).
//
// The output is a PURE FUNCTION of the tuple (seed, cellIndex, tick, streamId) — a
// murmur3-style integer hash, never a sequential stream. A stream PRNG makes a noise
// realization depend on iteration order, which GPU threads do not have; a sequential choice
// here would quietly foreclose Phase 5's oracle-vs-GPU comparison on every noise-on run.
//
// Integer-only operations (Math.imul, shifts) are exactly specified by ECMA-262, so this is
// bit-identical across engines — stronger than the pinned-oracle determinism scope the
// charter requires, which is fine.

function rotl32(x: number, r: number): number {
  return ((x << r) | (x >>> (32 - r))) | 0;
}

function mixK(k: number): number {
  k = Math.imul(k, 0xcc9e2d51);
  k = rotl32(k, 15);
  k = Math.imul(k, 0x1b873593);
  return k;
}

function mixH(h: number, k: number): number {
  h ^= mixK(k);
  h = rotl32(h, 13);
  h = (Math.imul(h, 5) + 0xe6546b64) | 0;
  return h;
}

/** Hash the counter tuple to a uniform u32. Pure; no state anywhere. */
export function hashCounter(
  seed: number,
  cellIndex: number,
  tick: number,
  streamId: number,
): number {
  let h = seed | 0;
  h = mixH(h, cellIndex | 0);
  h = mixH(h, tick | 0);
  h = mixH(h, streamId | 0);
  // murmur3 fmix32 finalizer
  h ^= 12; // "length": three 4-byte words
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** One fair bit from the tuple. */
export function randomBit(
  seed: number,
  cellIndex: number,
  tick: number,
  streamId: number,
): 0 | 1 {
  return (hashCounter(seed, cellIndex, tick, streamId) & 1) as 0 | 1;
}

/** Uniform float in [0, 1) from the tuple. */
export function randomUnit(
  seed: number,
  cellIndex: number,
  tick: number,
  streamId: number,
): number {
  return hashCounter(seed, cellIndex, tick, streamId) / 4294967296;
}

/** Stream id for the xi field of the gg-machinery §6 diffusion-slowdown noise. */
export const STREAM_NOISE_XI = 1;
