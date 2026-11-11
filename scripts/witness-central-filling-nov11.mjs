/** Real N64 process pause/resume witness; production targets and controls are unchanged. */
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HIL_CENTRAL_FILLING_NOV11_ROWS, centralFillingObservations } from '../runner/src/hil-central-filling-nov11-roster.ts';
import { runPostPhase10DiscoveryRow } from '../runner/src/post-phase10-discovery.ts';

const row = HIL_CENTRAL_FILLING_NOV11_ROWS.find(({ row }) => row.id === 'cf11-hil-a-t4p5-w4-s2p5').row;
const script = fileURLToPath(import.meta.url);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = path => JSON.parse(readFileSync(path, 'utf8'));
const [mode, location, checkpointMode, pause] = process.argv.slice(2);
if (mode === 'child') {
  const result = runPostPhase10DiscoveryRow(row, location, { checkpoint: checkpointMode,
    pauseAfterCycles: Number(pause), retainedObservations: centralFillingObservations(row),
    heartbeat: message => console.log(`${new Date().toISOString()} ${message}`) });
  assert.equal(result.stopReason, 'checkpoint-pause'); assert.deepEqual(result.integrityErrors, []);
  assert.equal(result.allRelaxationsConverged, true);
  console.log(JSON.stringify({ stopReason: result.stopReason, cycles: result.cycles }));
} else {
  assert.equal(mode, 'run', 'Usage: node scripts/witness-central-filling-nov11.mjs run <new-output-directory>');
  assert(location && !existsSync(location), 'witness output must be new');
  const root = resolve(location); mkdirSync(root, { recursive: true });
  const commands = []; const startedAt = new Date().toISOString();
  const full = resolve(root, 'uninterrupted'), split = resolve(root, 'resumed');
  const child = (path, kind, cycles) => {
    const args = [script, 'child', path, kind, String(cycles)];
    const stem = `${kind}-${path === full ? 'full' : 'split'}-${cycles}`;
    const before = new Date().toISOString();
    const result = spawnSync(process.execPath, args, { encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
    writeFileSync(resolve(root, `${stem}.stdout.log`), result.stdout ?? '');
    writeFileSync(resolve(root, `${stem}.stderr.log`), result.stderr ?? '');
    commands.push({ command: [process.execPath, ...args], startedAt: before, finishedAt: new Date().toISOString(),
      exitCode: result.status, signal: result.signal, stdout: `${stem}.stdout.log`, stderr: `${stem}.stderr.log` });
    writeFileSync(resolve(root, 'attempts.json'), JSON.stringify(commands, null, 2) + '\n');
    assert.equal(result.status, 0, result.stderr); console.log(`Finished ${stem}`);
  };
  child(full, 'create', 96);
  const firstInactive = json(resolve(full, 'captures/labels/width-first-inactive.json'));
  const transition = firstInactive.states.at(-1).tick;
  assert(transition > 1 && transition < 95, 'witness must cover the switch and later rotation');
  child(split, 'create', transition - 1);
  child(split, 'resume', transition);
  child(split, 'resume', 96);
  const events = path => readFileSync(resolve(path, 'events.jsonl'), 'utf8').trim().split(/\r?\n/).map(line => {
    const { rssBytes, ...scientific } = JSON.parse(line); return scientific;
  });
  assert.deepEqual(events(split), events(full));
  const retained = [];
  const directories = readdirSync(resolve(full, 'captures/generations')).filter(name => /^tick-\d+$/.test(name));
  assert.deepEqual(readdirSync(resolve(split, 'captures/generations')).filter(name => /^tick-\d+$/.test(name)).sort(), directories.sort());
  for (const directory of directories) {
    const bytes = readFileSync(resolve(full, 'captures/generations', directory, 'solver.bin'));
    assert(bytes.equals(readFileSync(resolve(split, 'captures/generations', directory, 'solver.bin'))), directory);
    retained.push({ directory, bytes: bytes.length, sha256: sha(bytes) });
  }
  const boundaries = readdirSync(resolve(full, 'captures/boundaries')).filter(name => name.endsWith('.json'));
  assert.equal(boundaries.length, 2);
  for (const file of boundaries) assert(readFileSync(resolve(full, 'captures/boundaries', file))
    .equals(readFileSync(resolve(split, 'captures/boundaries', file))), file);
  const last = path => {
    const ref = json(resolve(path, 'resume/latest.json')).current;
    return readFileSync(resolve(path, 'resume', ref.directory, 'solver.bin'));
  };
  assert(last(full).equals(last(split)), 'final complete scientific state');
  const receipt = { schema: 'hil-central-filling-capture-witness-v1', startedAt,
    finishedAt: new Date().toISOString(), gitHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    node: process.version, v8: process.versions.v8, scriptSha256: sha(readFileSync(script)), row,
    observationSettings: centralFillingObservations(row), commands, transitionCycle: transition,
    comparedScientificUpdates: events(full).length, retained, solvedBoundaryMaps: boundaries,
    eventPrefixEqualExceptRss: true, retainedStateBytesEqual: true, boundaryMapsByteEqual: true,
    finalStateBytesEqual: true, finalSolverSha256: sha(last(full)),
    scope: 'Fresh N64 processes, explicit completed-cycle pauses before/after the switch, then rotation. Existing interruption witnesses and focused copy-recovery test cover interruption; no physical gate.' };
  writeFileSync(resolve(root, 'verification.json'), JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify({ output: root, transition, states: retained.length, passed: true }));
}
