import { mkdirSync, openSync, closeSync, readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const stamp = new Date().toISOString().replaceAll(/[:.]/g, '-');
const runRoot = resolve(here, `witness-${stamp}`);
mkdirSync(runRoot);
const worker = resolve(here, 'worker.mjs');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const children = [];
async function run(mode, input) {
  const folder = resolve(runRoot, mode);
  mkdirSync(folder);
  const stdout = resolve(folder, 'stdout.log');
  const stderr = resolve(folder, 'stderr.log');
  const outFd = openSync(stdout, 'wx');
  const errorFd = openSync(stderr, 'wx');
  const args = [worker, mode, folder, ...(input ? [input] : [])];
  const started = new Date().toISOString();
  const child = spawn(process.execPath, args, { cwd: root, stdio: ['ignore', outFd, errorFd], windowsHide: true });
  closeSync(outFd); closeSync(errorFd);
  const timer = setTimeout(() => child.kill(), 60000);
  const exit = await new Promise((resolveExit, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolveExit({ code, signal }));
  });
  clearTimeout(timer);
  const result = { mode, pid: child.pid, execPath: process.execPath, argv: args, cwd: root, started,
    finished: new Date().toISOString(), ...exit, stdout, stderr };
  writeFileSync(resolve(folder, 'exit.json'), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
  children.push(result);
  assert.equal(exit.code, 0, `${mode} child must complete; inspect unique stderr`);
  return JSON.parse(readFileSync(resolve(folder, 'worker-receipt.json'), 'utf8'));
}
const direct = await run('direct');
const pause = await run('pause');
const resumed = await run('continue', pause.encoded.path);
assert.equal(new Set(children.map(row => row.pid)).size, 3, 'three separate fresh child processes');
assert.deepEqual(direct.reports.slice(0, 8), pause.reports, 'uninterrupted/pause report prefix');
assert.deepEqual(direct.stateAtEight, pause.final, 'exact cycle-eight scientific snapshot');
assert.deepEqual(pause.final, resumed.before, 'exact state preserved through disk decode/adoption');
assert.deepEqual(direct.reports[8], resumed.reports[0], 'exact resumed cycle-nine report');
assert.deepEqual(direct.final, resumed.final, 'exact final scientific snapshot');
assert(readFileSync(direct.encoded.path).equals(readFileSync(resumed.encoded.path)), 'exact final encoded scientific bytes');
const receipt = {
  schema: 'operational-lk-core-continuation-v1', pass: true, root, runRoot,
  sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  driverSha256: hash(readFileSync(fileURLToPath(import.meta.url))), workerSha256: hash(readFileSync(worker)),
  options: direct.options, checkpointCadence: 'pause after eight complete interface cycles',
  commands: children, checkpoint: pause.encoded, directFinal: direct.encoded, resumedFinal: resumed.encoded,
  checks: { freshProcesses: true, exactPrefix: true, exactPausedState: true, exactAdoptedState: true,
    exactFinalReport: true, exactFinalScientificBytes: true, attachments: pause.final.attachedCount,
    partialFillCount: pause.final.partialFillCount, cycleEightHoleFillCount: pause.reports[7].surface.holeFillCount,
    vaporMin: pause.final.vaporMin, vaporMax: pause.final.vaporMax, volumeRateM3PerS: pause.final.volumeRateM3PerS,
    sweeps: direct.reports.map(report => report.relaxation.sweeps) },
  limit: 'Named operational core disk/fresh-process witness only. Discovery runner has no restart writer; ADR0039 remains proposed. Not transferable to experimental modes, production protocols or larger domains.',
};
const receiptPath = resolve(runRoot, 'receipt.json');
writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ pass: true, receipt: receiptPath, finalSha256: direct.encoded.sha256, checks: receipt.checks }));
