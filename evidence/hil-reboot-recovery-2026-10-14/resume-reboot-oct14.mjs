import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateHilTwoDayOct12Campaign } from '../../runner/src/hil-two-day-oct12-main.ts';
import { HIL_TWO_DAY_OCT12 } from '../../runner/src/hil-two-day-oct12-roster.ts';
import { acquireFirstBatchLease, planFirstBatchResume } from '../../runner/src/hil-bld-batch-main.ts';
import { batchGitHead, launchDiscoveryRows, sampleBatchHost, writeBatchJson } from '../../runner/src/hil-bld-batch-execution.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
process.chdir(root);
const directory = resolve(root, 'out/hil-two-day-oct12');
const entryPath = resolve(root, 'runner/src/hil-two-day-oct12-main.ts');
const source = '0161a5126ea47d565db7d6534ed7b56c743c0ffc';
const ids = [
  'oct12-hil-history-step-t14p4-to-t6-f0p2-e15-cfl0p025-nodip',
  'oct12-hil-pressure-history-t14p4-to-t6-f0p1-e15-p202650-nodip',
  'oct12-hil-pressure-history-t14p4-to-t6-f0p2-e15-p202650-nodip',
  'oct12-hil-pressure-history-t14p4-to-t6-f0p2-e15-p50662p5-nodip',
];
const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
if (process.argv.length !== 4 || resolve(process.argv[2]) !== entryPath || resolve(process.argv[3]) !== directory) {
  throw new Error('Pass original entry and campaign paths for the registered recovery.');
}
if (batchGitHead() !== source || execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()) {
  throw new Error('Keep the executing checkout clean at its fixed producer.');
}
const campaignBytes = readFileSync(resolve(directory, 'campaign.json'));
validateHilTwoDayOct12Campaign(JSON.parse(campaignBytes.toString('utf8')));
const rows = ids.map(id => {
  const found = HIL_TWO_DAY_OCT12.rows.find(entry => entry.row.id === id);
  if (!found) throw new Error(`Missing registered row ${id}`);
  return found.row;
});
const release = acquireFirstBatchLease(directory);
try {
  const selected = planFirstBatchResume(directory, rows);
  if (selected.pending.length !== 4 || selected.skippedRowIds.length !== 0 ||
      selected.pending.some(entry => entry.command !== 'resume-row')) {
    throw new Error('Expected precisely four interrupted rows to resume.');
  }
  const attemptName = `reboot-${Date.now()}-${randomUUID()}`;
  const launchName = `hil-two-day-oct12-HIL-${attemptName}`;
  writeBatchJson(resolve(directory, `${launchName}-invocation.json`), {
    source, operationalPlanCommit: 'f6495b1', command: process.argv, pid: process.pid,
    startedAt: new Date().toISOString(), requestedConcurrency: 4,
    originalCampaignSha256: digest(campaignBytes),
    operationalScriptSha256: digest(readFileSync(fileURLToPath(import.meta.url))),
    excludedCompletedRows: 187,
    heldSolverFailure: 'oct12-hil-pressure-history-t6-to-t14p4-f0p1-e15-p202650-m1',
    pending: selected.pending.map(({ row, command }) => ({ rowId: row.id, command,
      previousCheckpoint: readJson(resolve(directory, 'rows', row.id, 'resume/latest.json')),
      previousStatus: readJson(resolve(directory, 'rows', row.id, 'status.json')),
    })),
  });
  console.log(JSON.stringify({ launchName, pending: ids, concurrency: 4 }));
  const exits = await launchDiscoveryRows({
    campaignDirectory: directory, launchName, rows: selected.pending.map(({ row }) => row),
    concurrency: 4, entryPath, attemptName, resumeExistingRows: true,
    workerArguments: (_row, rowDirectory) => ['resume-row', _row.id, rowDirectory],
    stopOnWorkerFailure: false, monitor: { sample: sampleBatchHost },
  });
  const completion = readJson(resolve(directory, `${launchName}-complete.json`));
  if (completion.abortReason !== null || exits.length !== 4 ||
      exits.some(exit => exit.exitCode !== 0 || exit.signal !== null || exit.termination !== undefined)) {
    process.exitCode = 2;
  }
  console.log(JSON.stringify({ launchName, completion: `${launchName}-complete.json`, exitCode: process.exitCode ?? 0 }));
} finally {
  release();
}
