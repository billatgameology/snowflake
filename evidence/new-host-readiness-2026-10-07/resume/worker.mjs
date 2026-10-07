import { open, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { LKSolver } from '@vcc/solver-cpu';
import { encodeLKResumeCheckpointV3, decodeLKResumeCheckpointV3 } from '@vcc/core';

const options = {
  surfacePolicy: 'aggregate-hv-g1h1-v6', dims: { nx: 12, ny: 12, nz: 9 },
  tempC: -5, sigmaInfinity: 0.01, dxUm: 0.35, pressurePa: 101325,
  paramSet: 'M1', cflFill: 0.2, relaxTol: 1e-8, divTol: 1e-6,
  relaxMaxSweeps: 200000, rngSeed: 0x12345678, noiseEpsilon: 0.25,
  domain: 'hexPrism', farField: 'monopole-matched', seedRadius: 2, seedThickness: 1,
};
const [mode, outputArg, inputArg] = process.argv.slice(2);
assert(['direct', 'pause', 'continue'].includes(mode), 'recognized witness mode required');
const output = resolve(outputArg);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const viewBytes = view => Buffer.from(view.buffer, view.byteOffset, view.byteLength);

function snapshot(solver) {
  const state = solver.resumeStateV3();
  const vapor = [];
  let partialFillCount = 0;
  for (let i = 0; i < state.a.length; i++) {
    if (solver.wall[i] === 0 && state.a[i] === 0) vapor.push(state.sigma[i]);
    if (state.a[i] === 0 && state.f[i] > 0 && state.f[i] < 1) partialFillCount++;
  }
  return {
    tick: state.tick, attachedCount: state.attachedCount, simTimeSeconds: state.simTimeSeconds,
    volumeRateM3PerS: state.volumeRateM3PerS, partialFillCount,
    vaporMin: Math.min(...vapor), vaporMax: Math.max(...vapor),
    holeFillCountTotal: state.holeFillCountTotal, fillLedger: state.fillLedger,
    holeFillDeficit: state.holeFillDeficit, saturationClippedFill: state.saturationClippedFill,
    lastRelaxation: state.lastRelaxation, ledger: solver.ledger(),
    fieldSha256: Object.fromEntries(['a', 'f', 'sigma'].map(name => [name, hash(viewBytes(state[name]))])),
    boundaryOrderSha256: hash(viewBytes(Uint32Array.from(state.boundaryOrder))),
    lastAttachedSha256: hash(viewBytes(Uint32Array.from(state.lastAttached))),
  };
}

async function checkpoint(solver, path) {
  const file = await open(path, 'wx');
  let position = 0;
  try {
    const summary = await encodeLKResumeCheckpointV3(solver.resumeStateV3(), {
      async write(chunk) {
        let consumed = 0;
        while (consumed < chunk.byteLength) {
          const { bytesWritten } = await file.write(chunk, consumed, chunk.byteLength - consumed, position);
          assert(bytesWritten > 0, 'checkpoint write progressed');
          consumed += bytesWritten;
          position += bytesWritten;
        }
      },
    });
    await file.sync();
    assert.equal(position, summary.byteLength);
  } finally { await file.close(); }
  const bytes = await readFile(path);
  return { path, bytes: bytes.byteLength, sha256: hash(bytes) };
}

const started = new Date().toISOString();
let solver;
if (mode === 'continue') {
  const file = await open(resolve(inputArg), 'r');
  try {
    const { size } = await file.stat();
    const decoded = await decodeLKResumeCheckpointV3({
      byteLength: size,
      async readExactly(position, target) {
        let consumed = 0;
        while (consumed < target.byteLength) {
          const { bytesRead } = await file.read(target, consumed, target.byteLength - consumed, position + consumed);
          assert(bytesRead > 0, 'checkpoint read progressed');
          consumed += bytesRead;
        }
      },
    });
    solver = LKSolver.fromResumeStateV3(decoded);
  } finally { await file.close(); }
  assert.equal(solver.tick, 8);
} else solver = new LKSolver(options);

const before = snapshot(solver);
const reports = [];
let stateAtEight = null;
const count = mode === 'direct' ? 9 : mode === 'pause' ? 8 : 1;
for (let i = 0; i < count; i++) {
  const report = solver.step();
  assert.equal(report.relaxation.converged, true);
  assert(report.relaxation.sweeps > 1);
  reports.push(report);
  if (solver.tick === 8) stateAtEight = snapshot(solver);
}
if (mode !== 'continue') {
  assert.equal(reports[7].surface.holeFillCount > 0, true, 'known cycle-eight hole fill executed');
  assert(stateAtEight.attachedCount > 19, 'genuine attachment');
  assert(stateAtEight.partialFillCount > 0, 'nonzero partial fill');
  assert(stateAtEight.vaporMin < stateAtEight.vaporMax, 'nonuniform vapor field');
  assert(stateAtEight.volumeRateM3PerS > 0, 'nonzero carried monopole lag');
}
const final = snapshot(solver);
const encoded = await checkpoint(solver, `${output}/state-v3.ckpt`);
const receipt = {
  schema: 'operational-lk-core-continuation-worker-v1', mode, pid: process.pid,
  execPath: process.execPath, argv: process.argv, versions: process.versions,
  started, finished: new Date().toISOString(), options, before, stateAtEight, final, reports, encoded,
  limit: 'Named operational core witness only; not production discovery resume or ADR0039 acceptance.',
};
await writeFile(`${output}/worker-receipt.json`, `${JSON.stringify(receipt, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ mode, tick: solver.tick, pid: process.pid, checkpoint: encoded }));
