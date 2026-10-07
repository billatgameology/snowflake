import { mkdirSync, openSync, closeSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { spawn, execFile, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpus, hostname, platform, release, totalmem } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { promisify } from 'node:util';
import assert from 'node:assert/strict';
import { GROW_LK_DEFAULTS } from '../../../runner/src/grow-lk-defaults.ts';

assert.equal(process.argv[2], 'ladder', 'Use explicit ladder mode only after timing authorization');
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const runRoot = resolve(here, `ladder-${new Date().toISOString().replaceAll(/[:.]/g, '-')}`);
mkdirSync(runRoot);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
assert.equal(GROW_LK_DEFAULTS.pressurePa, 101325);
assert.equal(GROW_LK_DEFAULTS.seedRadius, 2);
assert.equal(GROW_LK_DEFAULTS.seedThickness, 1);
assert.equal(GROW_LK_DEFAULTS.relaxMaxSweeps, 200000);
const args = [
  'runner/src/main.ts', 'grow-lk', '--temp-c', '-5', '--sigma-inf', '0.00375',
  '--dims', '64,64,64', '--dx-um', '0.35', '--param-set', 'M1', '--cfl', '0.05',
  '--tol', '1e-9', '--div-tol', '1e-7', '--steps', '3', '--target-extent', '1000000',
  '--surface-policy', 'aggregate-hv-g1h1-v6', '--far-field', 'monopole-matched',
  '--seed', '1', '--noise', '0', '--metrics-every', '1',
];
const execFileAsync = promisify(execFile);
const ownedChildren = new Set();
process.on('exit', () => { for (const child of ownedChildren) child.kill(); });
process.on('SIGINT', () => { for (const child of ownedChildren) child.kill(); process.exitCode = 130; });
process.on('SIGTERM', () => { for (const child of ownedChildren) child.kill(); process.exitCode = 143; });
async function hostSample(pids) {
  assert(pids.every(pid => Number.isSafeInteger(pid) && pid > 0));
  const command = `
    $taskPids = @(${pids.join(',')});
    $taskProcesses = @();
    if ($taskPids.Count -gt 0) { $taskProcesses = @(Get-Process -Id $taskPids -ErrorAction SilentlyContinue | Select-Object Id,CPU,WorkingSet64,PeakWorkingSet64) };
    $taskCounters = (Get-Counter -Counter '\\Memory\\Available Bytes','\\Memory\\Committed Bytes','\\Memory\\Commit Limit','\\Processor(_Total)\\% Processor Time' -ErrorAction Stop).CounterSamples;
    $taskAvailable = ($taskCounters | Where-Object { $_.Path -like '*\\memory\\available bytes' }).CookedValue;
    $taskCommitted = ($taskCounters | Where-Object { $_.Path -like '*\\memory\\committed bytes' }).CookedValue;
    $taskCommitLimit = ($taskCounters | Where-Object { $_.Path -like '*\\memory\\commit limit' }).CookedValue;
    $taskCpu = ($taskCounters | Where-Object { $_.Path -like '*\\processor(_total)\\% processor time' }).CookedValue;
    [pscustomobject]@{ capturedUtc=(Get-Date).ToUniversalTime().ToString('o');
      availablePhysicalBytes=[uint64]$taskAvailable;
      commitLimitBytes=[uint64]$taskCommitLimit; committedBytes=[uint64]$taskCommitted;
      commitHeadroomBytes=[uint64]$taskCommitLimit-[uint64]$taskCommitted;
      cpuPercent=[double]$taskCpu; children=$taskProcesses } | ConvertTo-Json -Depth 4 -Compress;
  `;
  const { stdout } = await execFileAsync('powershell.exe', ['-NoProfile', '-Command', command], { encoding: 'utf8', windowsHide: true, timeout: 30000 });
  const result = JSON.parse(stdout);
  assert(Number.isFinite(result.availablePhysicalBytes) && result.availablePhysicalBytes > 0);
  assert(Number.isFinite(result.commitHeadroomBytes) && result.commitHeadroomBytes > 0);
  return result;
}
const existingSolverPids = JSON.parse(execFileSync('powershell.exe', ['-NoProfile', '-Command',
  `$taskExisting = @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match 'runner[\\/]src[\\/].*(grow-lk|discovery-main|gate[0-9])' } | Select-Object -ExpandProperty ProcessId); ConvertTo-Json -InputObject $taskExisting -Compress`
], { encoding: 'utf8', windowsHide: true })).map(Number);
assert.equal(existingSolverPids.length, 0, 'No unrelated solver process during operational capacity timing');
const startingHost = await hostSample([]);
const invocation = { schema: 'operational-host-capacity-invocation-v1', runRoot, sourceHead,
  driverSha256: hash(readFileSync(fileURLToPath(import.meta.url))), execPath: process.execPath,
  argv: process.argv, childArgv: args, cwd: root, versions: process.versions,
  host: { hostname: hostname(), platform: platform(), release: release(), totalmem: totalmem(), cpus: cpus() },
  startingHost, ladder: [1,2,4,8,12,16,20], sampleCadenceMs: 2000,
  memorySampleSource: 'Windows Memory Available Bytes, Committed Bytes and Commit Limit performance counters',
  lowerLimits: { availablePhysicalBytes: 12*1024**3, commitHeadroomBytes: 8*1024**3 },
  caps: { rungSeconds: 180, calibrationSecondsBeforeAmendment: 60 },
  unflaggedDefaults: { pressurePa: GROW_LK_DEFAULTS.pressurePa, seedRadius: GROW_LK_DEFAULTS.seedRadius,
    seedThickness: GROW_LK_DEFAULTS.seedThickness, relaxMaxSweeps: GROW_LK_DEFAULTS.relaxMaxSweeps },
  limit: 'Unchanged ordinary N64 three-cycle initial-solve-heavy host timing, not a science gate or a transfer claim for larger/experimental rows.',
};
writeFileSync(resolve(runRoot, 'invocation.json'), `${JSON.stringify(invocation, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ starting: true, runRoot, exactCommand: [process.execPath, ...args], sourceHead }));
const rungs = [];
let referenceFinalLine;
let disposition = 'complete';
for (const concurrency of invocation.ladder) {
  const folder = resolve(runRoot, `concurrency-${concurrency}`);
  mkdirSync(folder);
  const samplesPath = resolve(folder, 'samples.jsonl');
  const rows = [];
  let abortReason = null;
  const startedUtc = new Date().toISOString();
  const start = performance.now();
  for (let index = 0; index < concurrency; index++) {
    const rowFolder = resolve(folder, `row-${String(index).padStart(2, '0')}`);
    mkdirSync(rowFolder);
    const stdout = resolve(rowFolder, 'stdout.log');
    const stderr = resolve(rowFolder, 'stderr.log');
    const outFd = openSync(stdout, 'wx');
    const errorFd = openSync(stderr, 'wx');
    const rowStart = performance.now();
    const child = spawn(process.execPath, args, { cwd: root, windowsHide: true, stdio: ['ignore', outFd, errorFd] });
    ownedChildren.add(child);
    closeSync(outFd); closeSync(errorFd);
    const row = { index, folder: rowFolder, stdout, stderr, pid: child.pid, startedUtc: new Date().toISOString(),
      child, done: false, elapsedSeconds: null, code: null, signal: null, cpuSecondsLastSample: null,
      peakWorkingSetBytesSampled: 0, peakWorkingSetBytesOs: 0 };
    row.completion = new Promise(resolveExit => {
      child.once('error', error => { row.error = error.message; });
      child.once('close', (code, signal) => {
        ownedChildren.delete(child);
        row.done = true; row.code = code; row.signal = signal;
        row.finishedClock = performance.now();
        row.elapsedSeconds = (row.finishedClock-rowStart)/1000;
        row.finishedUtc = new Date().toISOString();
        resolveExit();
      });
    });
    rows.push(row);
  }
  const rungTimer = setTimeout(() => {
    abortReason = 'rung-wall-time-cap';
    for (const row of rows.filter(item => !item.done)) row.child.kill();
  }, invocation.caps.rungSeconds*1000);
  let maxActualOverlap = 0;
  let minimumAvailableBytes = Infinity;
  let minimumCommitHeadroomBytes = Infinity;
  let maxCpuPercent = 0;
  let nextSample = performance.now();
  while (rows.some(row => !row.done)) {
    const pending = rows.filter(row => !row.done);
    const sampleStart = performance.now();
    const sample = await hostSample(pending.map(row => row.pid));
    sample.elapsedSeconds = (performance.now()-start)/1000;
    sample.sampleSeconds = (performance.now()-sampleStart)/1000;
    sample.pendingChildPids = pending.map(row => row.pid);
    appendFileSync(samplesPath, `${JSON.stringify(sample)}\n`);
    maxActualOverlap = Math.max(maxActualOverlap, sample.children.length);
    minimumAvailableBytes = Math.min(minimumAvailableBytes, sample.availablePhysicalBytes);
    minimumCommitHeadroomBytes = Math.min(minimumCommitHeadroomBytes, sample.commitHeadroomBytes);
    maxCpuPercent = Math.max(maxCpuPercent, sample.cpuPercent);
    for (const childSample of sample.children) {
      const row = rows.find(item => item.pid === childSample.Id);
      row.cpuSecondsLastSample = childSample.CPU;
      row.peakWorkingSetBytesSampled = Math.max(row.peakWorkingSetBytesSampled, childSample.WorkingSet64);
      row.peakWorkingSetBytesOs = Math.max(row.peakWorkingSetBytesOs, childSample.PeakWorkingSet64);
    }
    if (sample.availablePhysicalBytes < invocation.lowerLimits.availablePhysicalBytes) abortReason = 'available-physical-memory-cap';
    else if (sample.commitHeadroomBytes < invocation.lowerLimits.commitHeadroomBytes) abortReason = 'commit-headroom-cap';
    else if ((performance.now()-start)/1000 > invocation.caps.rungSeconds) abortReason = 'rung-wall-time-cap';
    if (abortReason) { for (const row of rows.filter(item => !item.done)) row.child.kill(); break; }
    nextSample += invocation.sampleCadenceMs;
    await new Promise(resolveWait => setTimeout(resolveWait, Math.max(0, nextSample-performance.now())));
  }
  await Promise.all(rows.map(row => row.completion));
  clearTimeout(rungTimer);
  const rungSeconds = (Math.max(...rows.map(row => row.finishedClock))-start)/1000;
  const outputs = rows.map(row => {
    const bytes = readFileSync(row.stdout);
    const text = bytes.toString('utf8');
    const finalLine = text.split(/\r?\n/).find(line => line.startsWith('stop reason=')) ?? null;
    const exit = { index: row.index, pid: row.pid, startedUtc: row.startedUtc, finishedUtc: row.finishedUtc,
      execPath: process.execPath, argv: args, cwd: root, code: row.code, signal: row.signal,
      elapsedSeconds: row.elapsedSeconds, error: row.error ?? null, stdout: row.stdout, stderr: row.stderr,
      stdoutBytes: bytes.length, stdoutSha256: hash(bytes), stderrBytes: readFileSync(row.stderr).length,
      finalLine, cpuSecondsLastSample: row.cpuSecondsLastSample,
      peakWorkingSetBytesSampled: row.peakWorkingSetBytesSampled, peakWorkingSetBytesOs: row.peakWorkingSetBytesOs };
    writeFileSync(resolve(row.folder, 'exit.json'), `${JSON.stringify(exit, null, 2)}\n`, { flag: 'wx' });
    return exit;
  });
  const valid = !abortReason && outputs.every(row => row.code === 0 && row.stderrBytes === 0 &&
    row.finalLine?.includes('stop reason=step-cap step=3 ') && row.finalLine.includes('allConverged=true'));
  if (valid) {
    referenceFinalLine ??= outputs[0].finalLine;
    assert(outputs.every(row => row.finalLine === referenceFinalLine), 'Identical terminal numerical line across unchanged identical rows');
  }
  const rung = { concurrency, startedUtc, finishedUtc: new Date().toISOString(), actualMaxSampledOverlap: maxActualOverlap,
    wallSeconds: rungSeconds, validThroughputMeasurement: valid, abortReason,
    completedRowsPerSecond: valid ? concurrency/rungSeconds : null, minimumAvailableBytes,
    minimumCommitHeadroomBytes, maxCpuPercent, rows: outputs, samplesPath };
  writeFileSync(resolve(folder, 'result.json'), `${JSON.stringify(rung, null, 2)}\n`, { flag: 'wx' });
  rungs.push(rung);
  console.log(JSON.stringify({ concurrency, wallSeconds: rungSeconds, rowsPerSecond: rung.completedRowsPerSecond,
    sampledOverlap: maxActualOverlap, abortReason, result: resolve(folder, 'result.json') }));
  if (!valid) { disposition = 'incomplete-resource-or-child-refusal'; break; }
  if (concurrency === 1 && outputs[0].elapsedSeconds > 60) {
    disposition = 'requires-committed-uniform-N48-amendment'; break;
  }
}
const validRungs = rungs.filter(rung => rung.validThroughputMeasurement);
const highest = Math.max(...validRungs.map(rung => rung.completedRowsPerSecond));
const recommended = disposition === 'complete' ? validRungs.find(rung => rung.completedRowsPerSecond >= highest*0.95)?.concurrency : null;
const result = { schema: 'operational-host-capacity-result-v1', disposition, sourceHead, invocation: resolve(runRoot, 'invocation.json'),
  runRoot, recommendedConcurrency: recommended, highestCompletedRowsPerSecond: Number.isFinite(highest) ? highest : null,
  selectionRule: 'Smallest concurrency within5%of highest measured aggregate throughput, at most20, reserving4logical slots.',
  rungs, endingHost: await hostSample([]), limit: invocation.limit };
const resultPath = resolve(runRoot, 'result.json');
writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ disposition, recommendedConcurrency: recommended, result: resultPath }));
if (disposition !== 'complete') process.exitCode = 2;
