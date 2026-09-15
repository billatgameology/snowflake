#!/usr/bin/env node
// No arguments: print the prepared-film score. --check: reject byte/provenance drift.
// Only the first eight reviewed sequences are prepared; upstream files are read-only.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildOpeningScore, checkOpeningScore, provisionalCaptions } from './build-part1-opening-score.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = 'docs/video/part1-score.json';
const openingPath = 'docs/video/part1-opening-score.json';
const outputPath = 'docs/video/part1-prepared-score.json';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const copy = value => structuredClone(value);
const sequenceKeys = ['S00', 'S01', 'S02', 'S05', 'S06', 'S11', 'S09', 'S13'];
const direction = {
  S06: [
    ['diffraction', 'The hidden arrangement'], ['lattice', 'Inside ice'],
    ['facets', 'Ends and sides'], ['lattice-limits', 'Geometry is not the whole answer'], ['facets', 'Ends and sides']
  ],
  S11: [
    ['terraces', 'A place to join'], ['slow-faces', 'The slow faces survive'],
    ['equilibrium', 'A growing shape'], ['bottlenecks', 'Delivery and attachment'], ['transport-handoff', 'Into the surrounding air']
  ],
  S09: [
    ['random-walks', 'A molecule wanders'], ['halo', 'The invisible shortage'],
    ['droplet-threshold', 'A visible clue'], ['gradients', 'The exposed advantage'], ['gradients', 'Follow the gradient']
  ],
  S13: [
    ['corner-feedback', 'A corner gets ahead'], ['perturbation', 'A disturbance grows'],
    ['six-corners', 'Direction and delivery'], ['model-return', 'Look at this branch'], ['model-return', 'A question in the ice']
  ]
};
const qualifiers = {
  S06: 'The lattice view shows an ideal three-dimensional ice Ih oxygen sublattice, with hydrogen positions omitted; it is not the Run B model grid or a molecular growth simulation. The diffraction sketch is not measured data. Lattice geometry alone does not select plate versus column or guarantee identical arms; no bond-angle-only explanation is claimed.',
  S11: 'Relative growth rates are illustrated by deposition and material addition, not carving or erosion. Terrace drawings distinguish mobile surface molecules from incorporated ice. Delivery and Hertz–Knudsen attachment are two constraints, not a claim that other transport effects never matter.',
  S09: 'The field is qualitative, not measured data or a computed Run B field; particle paths and time compression are schematic. Less spare vapour near ice and more farther away remain explicit. The droplet-free threshold is illustrated on a supporting substrate, not as a measured full field or an airborne cloud cavity. Net inward transport is distinct from outward growth.',
  S13: 'This is a simplified diffusion-limited branching-instability explanation, not a claim that every bump grows. Keep net inward vapour transport distinct from outward growth. Directional-control comparisons describe sourced model work, not fabricated runs; the separately labeled Run B replay does not validate the mechanism.'
};

export function buildPreparedScore(
  sourceBytes = readFileSync(path.join(repoRoot, sourcePath)),
  openingBytes = readFileSync(path.join(repoRoot, openingPath))
) {
  assert(Buffer.isBuffer(sourceBytes) && Buffer.isBuffer(openingBytes), 'Bind actual source and opening score bytes');
  // The opening compiler re-runs the full production script/review/source checks.
  const compiledOpening = buildOpeningScore(sourceBytes);
  checkOpeningScore(openingBytes, compiledOpening);
  const opening = JSON.parse(openingBytes.toString('utf8'));
  const source = JSON.parse(sourceBytes.toString('utf8'));
  const draft = source.productionDraft;
  assert.deepEqual(draft.sequences.slice(0, 8).map(sequence => sequence.key), sequenceKeys, 'Prepared sequence selection/order changed');
  assert.equal(draft.activeForPlayback, false, 'Do not activate unprepared production rows');
  const cues = copy(opening.cues);
  assert.equal(cues.length, 20, 'Expected the complete twenty-row opening');
  assert.equal(cues.at(-1).id, 'S05-05', 'Opening transition identity changed');
  cues.at(-1).visual.theme = 'interface-transition';
  for (const sequence of draft.sequences.slice(4, 8)) {
    assert.equal(sequence.rows.length, 5, `Expected five reviewed rows in ${sequence.key}`);
    for (const [index, row] of sequence.rows.entries()) {
      assert.equal(row.id, `${sequence.key}-${String(index + 1).padStart(2, '0')}`, 'Reviewed row identity changed');
      assert.equal(row.startSeconds, cues.at(-1).end, 'Prepared row gap or overlap');
      const [theme, title] = direction[sequence.key][index];
      const isModel = sequence.key === 'S13' && index >= 3;
      cues.push({
        id: row.id, sequenceKey: sequence.key, start: row.startSeconds, end: row.endSeconds,
        title, eyebrow: sequence.title, kind: isModel ? 'model' : 'diagram',
        narration: row.narration, description: row.onScreen,
        qualification: isModel
          ? 'MODEL · UNVALIDATED. This cropped mid-growth Run B replay is not a measurement or proof of the preceding mechanism. Cells are model cells, not molecules; G-G ticks are not physical seconds. The return explicitly advances the offstage model from tick 7,000 to 18,000 at 1,000 film seconds, then shows ticks 18,000–30,000. No natural temperature, measured vapour field or completed silhouette is attributed to this view.'
          : `DIAGRAM · qualitative, not measured data or a molecular simulation. ${qualifiers[sequence.key]}`,
        sources: sequence.sources.map(({ path: sourceFile, anchor }) => ({ path: sourceFile, anchor })),
        sourceBindings: copy(sequence.sources), sourceBindingText: sequence.sourceBindingText, sourceScope: sequence.sourceScope,
        scriptLine: row.scriptLine,
        review: 'Narration and original ON SCREEN text are source-reviewed at the bound script identity; generated caption timing and visual implementation remain provisional.',
        visual: { component: isModel ? 'RunB' : 'OpeningDiagram', theme, origin: isModel ? 'identified project replay; cropped mid-growth return' : 'original authored diagram', progress: [0, 1], ...(isModel ? { ticks: index === 3 ? [18000, 30000] : [30000, 30000] } : {}) },
        captions: provisionalCaptions(row.narration, row.startSeconds, row.endSeconds)
      });
    }
  }
  assert.equal(cues.length, 40, 'Expected forty prepared rows');
  assert.equal(cues.at(-1).end, 1040, 'Prepared film must end at the reviewed S13 endpoint');
  const unchangedOpening = copy(cues.slice(0, 20));
  unchangedOpening.at(-1).visual.theme = 'interface';
  assert.deepEqual(unchangedOpening, opening.cues, 'The prepared edition must preserve the opening except its final theme');
  const shots = [
    ...copy(opening.visualDirection.shots),
    { time: 1000, tick: 18000, tilt: 0, yaw: 210, span: 1.1, minimum: 8, target: 0.55, cut: true },
    { time: 1030, tick: 30000, tilt: 12, yaw: 210, span: 1, minimum: 8, target: 0.55 },
    { time: 1040, tick: 30000, tilt: 12, yaw: 210, span: 1, minimum: 8, target: 0.55 }
  ];
  assert.equal(shots[6].time, 520, 'Opening camera endpoint changed');
  assert.equal(shots[6].tick, 7000, 'Opening model must hold at tick 7,000');
  return {
    ...copy(opening), edition: 'prepared-film',
    status: 'WP4/WP5 prepared film through S13; reviewed narration with timing-only audio; maker read, recording, later sequences and finished-film acceptance pending',
    title: 'How a snowflake is made — prepared film', duration: 1040,
    script: 'The first eight reviewed production sequences, S00 through the selected S13 endpoint, are copied unchanged. This prepared edition does not activate the unproduced remainder of the full film.',
    provenance: { ...copy(opening.provenance), generator: 'scripts/build-part1-prepared-score.mjs', openingScore: { path: openingPath, sha256: sha256(openingBytes), bytes: openingBytes.length }, selectedSequenceKeys: sequenceKeys, openingChange: 'S05-05 visual.theme changes from interface to interface-transition; all other opening cue fields are preserved.' },
    audio: { ...copy(opening.audio), id: 'part1-prepared-timing', url: '/film/part1-prepared-timing.wav', duration: 1040 },
    visualDirection: {
      revision: 'prepared-film-directed-attention-v1',
      contract: `${opening.visualDirection.contract} The opening camera keys are unchanged through 520 seconds. Hold tick 7,000 offstage until the explicit cut at 1,000 seconds, which advances to tick 18,000. Continue to a cropped tick-30,000 branch and hold; do not reveal the final silhouette. Film time, G-G ticks and camera scale have no implied physical-time or length equivalence.`,
      look: copy(opening.visualDirection.look), shots,
      offstageAdvances: [{ time: 1000, fromTick: 7000, toTick: 18000, kind: 'explicit-model-time-compression-cut', physicalTime: false, qualification: 'The hidden model advances before the cropped return; this is editorial time compression, not a physical growth duration or measured event.' }]
    },
    cues
  };
}

export const serializePreparedScore = score => JSON.stringify(score, null, 2) + '\n';
export function checkPreparedScore(outputBytes, expected) {
  assert.equal(outputBytes.toString('utf8'), serializePreparedScore(expected), 'Prepared score has byte or provenance drift; regenerate from the verified opening and production sources');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    assert(process.argv.length <= 3 && (!process.argv[2] || process.argv[2] === '--check'), 'Usage: node scripts/build-part1-prepared-score.mjs [--check]');
    const score = buildPreparedScore();
    if (process.argv[2] === '--check') {
      checkPreparedScore(readFileSync(path.join(repoRoot, outputPath)), score);
      console.log(`Prepared score current: ${score.cues.length} rows; ${score.duration}s; ${score.cues.reduce((n, cue) => n + cue.captions.length, 0)} provisional captions; script SHA-256 ${score.provenance.script.sha256}`);
    } else process.stdout.write(serializePreparedScore(score));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
