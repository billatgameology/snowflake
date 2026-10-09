import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, existsSync, readFileSync, writeFileSync, openSync, closeSync, copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hostname } from 'node:os';
import { HIL_WARM_REFINEMENT_ROWS } from '../../runner/src/hil-warm-refinement-roster.ts';

// Reproduce with Node v24.13.1 from this frozen implementation worktree:
// node evidence/hil-warm-refinement-2026-10-08/n126-witness.mjs <new-output-directory> <producer-sha>
// The optional destination defaults to the script's directory. Existing run directories are refused.
const root = resolve(process.argv[2] ?? dirname(fileURLToPath(import.meta.url)));
const cwd = process.cwd();
const expectedHead = process.argv[3];
if (!expectedHead || !/^[0-9a-f]{40}$/.test(expectedHead)) throw new Error('Supply the exact committed producer SHA as the second argument');
const entry = resolve(cwd, 'runner/test/fixtures/discovery-resume-worker.ts');
const gitHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }).trim();
if (gitHead !== expectedHead) throw new Error(`Expected frozen implementation ${expectedHead}, got ${gitHead}`);
const gitStatus = execFileSync('git', ['status', '--porcelain'], { cwd, encoding: 'utf8' }).trim();
if (gitStatus) throw new Error(`Implementation must remain clean: ${gitStatus}`);
mkdirSync(root, { recursive: true });
const direct = resolve(root, 'direct');
const interrupted = resolve(root, 'interrupted-resumed');
if ([direct, interrupted, resolve(root, 'receipt.json')].some(existsSync)) throw new Error('Refusing existing witness outputs');
const row = { ...HIL_WARM_REFINEMENT_ROWS.find(({ row }) => row.id === 'warm-refine-fine-thick-t4p5-early').row, maxSteps: 3 };
if (row.dimsN !== 126 || row.targetExtent !== 57) throw new Error('Expected registered N126 target57 representative');
const rowPath = resolve(root, 'row.json');
const json = (path) => JSON.parse(readFileSync(path, 'utf8'));
const put = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
const sha = (value) => createHash('sha256').update(value).digest('hex');
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
const processes = [];
const live = new Set();
const startedAt = new Date().toISOString();
let stoppedReceipt = null;
put(rowPath, row);
put(resolve(root, 'invocation.json'), { schema: 'discovery-real-n126-resume-witness-invocation-v1',
  command: process.argv, cwd, source: gitHead, gitStatus, node: process.version, v8: process.versions.v8,
  hostname: hostname(), parentPid: process.pid, startedAt, row, scope: 'actual N126 three-completed-update continuation; not host capacity or scientific endpoint evidence' });

function start(label, output, checkpoint) {
  const stdout = resolve(root, `${label}.stdout.log`);
  const stderr = resolve(root, `${label}.stderr.log`);
  const out = openSync(stdout, 'wx'); const err = openSync(stderr, 'wx');
  const command = [process.execPath, entry, rowPath, output, checkpoint];
  const child = spawn(command[0], command.slice(1), { cwd, windowsHide: true, stdio: ['ignore', out, err] });
  closeSync(out); closeSync(err);
  const record = { label, command, pid: child.pid, startedAt: new Date().toISOString(), stdout, stderr, output, checkpoint };
  processes.push(record); put(resolve(root, 'processes.json'), processes); live.add(child);
  console.log(`started ${label} pid=${child.pid}`);
  const done = new Promise((resolveExit, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => {
      live.delete(child); Object.assign(record, { exitCode: code, signal, finishedAt: new Date().toISOString() });
      put(resolve(root, `${label}.exit.json`), record); put(resolve(root, 'processes.json'), processes);
      console.log(`finished ${label} code=${code} signal=${signal}`); resolveExit(record);
    });
  });
  return { child, done };
}
function latest(output) {
  const pointer = json(resolve(output, 'resume/latest.json'));
  const directory = resolve(output, 'resume', pointer.current.directory);
  const manifest = json(resolve(directory, 'manifest.json'));
  return { pointer, directory, manifest };
}
function scientificResult(value) {
  const { wallSeconds, peakRssBytes, startedAt, finishedAt, ...science } = value;
  return science;
}
function scientificEvents(output) {
  return readFileSync(resolve(output, 'events.jsonl'), 'utf8').trim().split('\n').map((line) => {
    const { rssBytes, ...science } = JSON.parse(line); return science;
  });
}
const timeout = setTimeout(() => {
  for (const child of live) child.kill();
  console.error('Operational witness deadline reached; killed only owned children');
}, 60 * 60 * 1000);
try {
  const directRun = start('direct', direct, 'create');
  const original = start('interrupted', interrupted, 'create');
  const deadline = Date.now() + 45 * 60 * 1000;
  while (Date.now() < deadline && original.child.exitCode === null) {
    if (existsSync(resolve(interrupted, 'resume/latest.json'))) {
      const candidate = latest(interrupted);
      if (candidate.manifest.tick >= 1 && candidate.manifest.tick < 3 && !existsSync(resolve(interrupted, 'result.json'))) {
        const observedAt = new Date().toISOString();
        const requested = original.child.kill();
        stoppedReceipt = { observedAt, pid: original.child.pid, checkpointTickObservedBeforeKill: candidate.manifest.tick,
          generationObservedBeforeKill: candidate.pointer.current, killMethod: 'ChildProcess.kill() on owned exact child; Windows process termination', killRequested: requested };
        console.log(`requested interruption at committed tick=${candidate.manifest.tick} pid=${original.child.pid}`);
        break;
      }
    }
    await sleep(10);
  }
  if (stoppedReceipt === null) { original.child.kill(); throw new Error('Did not observe a preterminal completed checkpoint before worker finished'); }
  const stopped = await original.done;
  if (stopped.exitCode === 0) throw new Error('Worker completed normally instead of being interrupted');
  const retained = latest(interrupted);
  if (retained.manifest.tick < 1 || retained.manifest.tick >= 3) throw new Error('Interruption did not retain a preterminal checkpoint');
  mkdirSync(resolve(root, 'interruption'), { recursive: true });
  for (const file of ['solver.bin', 'manifest.json']) copyFileSync(resolve(retained.directory, file), resolve(root, 'interruption', file));
  copyFileSync(resolve(interrupted, 'resume/latest.json'), resolve(root, 'interruption/latest.json'));
  copyFileSync(resolve(interrupted, 'events.jsonl'), resolve(root, 'interruption/events.jsonl'));
  Object.assign(stoppedReceipt, { retainedTick: retained.manifest.tick, retainedSolverSha256: sha(readFileSync(resolve(retained.directory, 'solver.bin'))),
    retainedManifestSha256: sha(readFileSync(resolve(retained.directory, 'manifest.json'))), actualExit: stopped });
  put(resolve(root, 'interruption/receipt.json'), stoppedReceipt);
  const resumedRun = start('resumed', interrupted, 'resume');
  const [directExit, resumedExit] = await Promise.all([directRun.done, resumedRun.done]);
  if (directExit.exitCode !== 0 || resumedExit.exitCode !== 0) throw new Error('Direct or resumed child failed; inspect exact logs');
  const directResult = json(resolve(direct, 'result.json'));
  const resumedResult = json(resolve(interrupted, 'result.json'));
  if ([directResult, resumedResult].some((r) => r.cycles !== 3 || r.stopReason !== 'step-cap' || r.integrityErrors.length !== 0 || !r.allRelaxationsConverged)) {
    throw new Error('Expected three real completed converged updates with honest step-cap termination');
  }
  const directSolver = readFileSync(resolve(latest(direct).directory, 'solver.bin'));
  const resumedSolver = readFileSync(resolve(latest(interrupted).directory, 'solver.bin'));
  const resultA = JSON.stringify(scientificResult(directResult)); const resultB = JSON.stringify(scientificResult(resumedResult));
  const eventsA = JSON.stringify(scientificEvents(direct)); const eventsB = JSON.stringify(scientificEvents(interrupted));
  const snapshots = (directResult.spatialSnapshots ?? []).map((snapshot) => {
    const a = readFileSync(resolve(direct, snapshot.path)); const b = readFileSync(resolve(interrupted, snapshot.path));
    return { path: snapshot.path, bytes: a.length, directSha256: sha(a), resumedSha256: sha(b), exactBytesEqual: a.equals(b) };
  });
  const comparison = { finalSolver: { exactBytesEqual: directSolver.equals(resumedSolver), bytes: directSolver.length,
    directSha256: sha(directSolver), resumedSha256: sha(resumedSolver) }, scientificResult: { equal: resultA === resultB,
    directSha256: sha(resultA), resumedSha256: sha(resultB), omittedOperationalFields: ['wallSeconds', 'peakRssBytes', 'startedAt', 'finishedAt'] },
    scientificEvents: { equal: eventsA === eventsB, records: scientificEvents(direct).length, directSha256: sha(eventsA), resumedSha256: sha(eventsB), omittedOperationalFields: ['rssBytes'] }, snapshots };
  const passed = comparison.finalSolver.exactBytesEqual && comparison.scientificResult.equal && comparison.scientificEvents.equal &&
    snapshots.length > 0 && snapshots.every((snapshot) => snapshot.exactBytesEqual);
  put(resolve(root, 'receipt.json'), { schema: 'discovery-real-n126-resume-witness-v1', passed, source: gitHead,
    node: process.version, v8: process.versions.v8, hostname: hostname(), startedAt, finishedAt: new Date().toISOString(),
    scriptPath: fileURLToPath(import.meta.url), scriptSha256: sha(readFileSync(fileURLToPath(import.meta.url))),
    rowPath, rowSha256: sha(readFileSync(rowPath)), row, processes, interruption: stoppedReceipt, comparison,
    scope: 'one actual HIL representative at registered N126 physical settings, terminal three-update prefix; not mature geometry capacity or a scientific endpoint' });
  if (!passed) throw new Error('Scientific continuation comparison failed');
  console.log(`PASS N126 continuation: ${directResult.cycles} cycles, ${snapshots.length} spatial snapshots, solver sha256=${sha(directSolver)}`);
} catch (error) {
  for (const child of live) child.kill();
  put(resolve(root, 'failure.json'), { source: gitHead, at: new Date().toISOString(), error: error.stack ?? String(error), processes, interruption: stoppedReceipt });
  process.exitCode = 1;
  console.error(error);
} finally { clearTimeout(timeout); }
