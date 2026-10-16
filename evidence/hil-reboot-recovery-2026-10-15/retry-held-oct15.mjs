import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateHilTwoDayOct12Campaign } from '../../runner/src/hil-two-day-oct12-main.ts';
import { HIL_TWO_DAY_OCT12 } from '../../runner/src/hil-two-day-oct12-roster.ts';
import { acquireFirstBatchLease } from '../../runner/src/hil-bld-batch-main.ts';
import { DiscoveryCheckpointStore } from '../../runner/src/discovery-resume-io.ts';
import { batchGitHead, launchDiscoveryRows, sampleBatchHost, writeBatchJson } from '../../runner/src/hil-bld-batch-execution.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
process.chdir(root);
const directory = resolve(root, 'out/hil-two-day-oct12');
const entryPath = resolve(root, 'runner/src/hil-two-day-oct12-main.ts');
const source = '0161a5126ea47d565db7d6534ed7b56c743c0ffc';
const rowId = 'oct12-hil-pressure-history-t6-to-t14p4-f0p1-e15-p202650-m1';
const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
if (process.argv.length !== 4 || resolve(process.argv[2]) !== entryPath || resolve(process.argv[3]) !== directory) throw new Error('Expected original entry and campaign paths');
if (batchGitHead() !== source || execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()) throw new Error('Keep clean fixed producer');
const campaignBytes = readFileSync(resolve(directory, 'campaign.json'));
validateHilTwoDayOct12Campaign(JSON.parse(campaignBytes.toString('utf8')));
const row = HIL_TWO_DAY_OCT12.rows.find(entry => entry.row.id === rowId)?.row;
if (!row) throw new Error('Missing exact registered row');
const rowDirectory = resolve(directory, 'rows', rowId);
if (JSON.stringify(readJson(resolve(rowDirectory, 'spec.json')).row) !== JSON.stringify(row)) throw new Error('Registered row mismatch');
const oldProcess = readJson(resolve(rowDirectory, 'process.json'));
try { process.kill(oldProcess.pid, 0); throw new Error(`Old worker PID is live: ${oldProcess.pid}`); }
catch (error) { if (error.code !== 'ESRCH') throw error; }
const previousResultBytes = readFileSync(resolve(rowDirectory, 'result.json'));
const previousResultSha256 = digest(previousResultBytes);
if (previousResultSha256 !== '4b218b4f22844527b3226428767260e6bcf5d77d02e39b30f2a4e8d13ebd72d2') throw new Error('Original failure differs; do not repeat a retry');
const release = acquireFirstBatchLease(directory);
try {
  const loaded = new DiscoveryCheckpointStore(rowDirectory, row, source).load();
  if (!loaded || loaded.decoded.tick !== 414 || !loaded.runner.allRelaxationsConverged || loaded.runner.integrityErrors.length || loaded.runner.terminalStopReason !== null) throw new Error('Expected verified saved update 414');
  const attemptName = `maker-retry-${Date.now()}-${randomUUID()}`;
  const launchName = `hil-two-day-oct12-HIL-${attemptName}`;
  writeBatchJson(resolve(directory, `${launchName}-invocation.json`), {
    source, operationalPlanCommit: 'feec0c7967ea2921756402fa58e8e15ec24b9aca',
    authorization: 'Maker requested one unchanged retry of the failed case on 2026-10-15.',
    command: process.argv, pid: process.pid, startedAt: new Date().toISOString(), requestedConcurrency: 1,
    originalCampaignSha256: digest(campaignBytes), operationalScriptSha256: digest(readFileSync(fileURLToPath(import.meta.url))),
    row, previousResultSha256, previousResult: JSON.parse(previousResultBytes.toString('utf8')),
    previousExit: readJson(resolve(rowDirectory, 'exit.json')), previousProcess: oldProcess,
    previousStatus: readJson(resolve(rowDirectory, 'status.json')),
    previousCheckpoint: readJson(resolve(rowDirectory, 'resume/latest.json')),
    checkpointVerification: 'Existing load verified row/source/runtime/host, strict solver bytes, runner state, event prefix and snapshots; recover not called by helper.'
  });
  console.log(JSON.stringify({ launchName, rowId, concurrency: 1, savedTick: loaded.decoded.tick }));
  const exits = await launchDiscoveryRows({ campaignDirectory: directory, launchName, rows: [row],
    concurrency: 1, entryPath, attemptName, resumeExistingRows: true,
    workerArguments: (_row, output) => ['resume-row', _row.id, output],
    stopOnWorkerFailure: true, monitor: { sample: sampleBatchHost } });
  const completion = readJson(resolve(directory, `${launchName}-complete.json`));
  if (completion.abortReason !== null || exits.length !== 1 || exits.some(exit => exit.exitCode !== 0 || exit.signal !== null || exit.termination !== undefined)) process.exitCode = 2;
  console.log(JSON.stringify({ launchName, completion, result: existsSync(resolve(rowDirectory, 'result.json')) ? readJson(resolve(rowDirectory, 'result.json')) : null }));
} finally { release(); }
