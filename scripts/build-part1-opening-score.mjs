#!/usr/bin/env node
// No arguments: print the prepared opening score. --check: reject byte/provenance drift.
// This command never writes files or activates the full production draft.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildProductionDraft, checkScore } from './build-part1-production-score.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = 'docs/video/part1-score.json';
const outputPath = 'docs/video/part1-opening-score.json';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const copy = value => structuredClone(value);
const keys = ['S00', 'S01', 'S02', 'S05'];
const direction = {
  S00: [
    ['macro', 'It looked simple'], ['seed', 'Nineteen model cells'],
    ['scales', 'Follow the water'], ['habit-intro', 'Look again'], ['habit-intro', 'Two shapes']
  ],
  S01: [
    ['habit-bands', 'Same water, different shapes'], ['habit-map', 'A map of steady conditions'],
    ['history', "Nakaya's map"], ['questions', 'Why does the shape change?'], ['particles', 'Follow the water']
  ],
  S02: [
    ['routes', 'Two routes into ice'], ['types', 'Crystal, flake and rime'],
    ['supercooling', 'Liquid below zero'], ['seed', 'A seed for vapour'], ['cloud', 'Liquid and ice together']
  ],
  S05: [
    ['balance', 'Two equilibrium levels'], ['relay', 'Liquid → vapour → ice'],
    ['budget', 'A large-crystal example'], ['depletion', 'When the liquid supply runs out'], ['interface', 'Toward the surface']
  ]
};
const qualifiers = {
  S00: 'Original explanatory diagrams; the physical account remains separate from the unvalidated Run B replay.',
  S01: 'Representative temperature bands, ice-relative supersaturation and constant growth conditions. The cold end is qualified; no precise boundaries or single-variable forecast is implied.',
  S02: 'The selected cloud-droplet route does not erase aggregation or riming. Supercooling/freezing timing and particle paths are illustrative; the zero-degree statement concerns the described droplets.',
  S05: "Same-temperature equilibrium comparison below zero; supersaturation relative to ice. Libbrecht's approximate 100,000-droplet budget concerns one large stellar crystal, not every flake. Exhausted liquid supply is not a global cold-temperature cutoff."
};

export function provisionalCaptions(narration, start, end) {
  assert(Number.isFinite(start) && Number.isFinite(end) && end > start, 'Invalid caption row bounds');
  if (!narration) return [];
  const words = narration.split(/\s+/u);
  assert.equal(words.join(' '), narration, 'Narration whitespace is not canonical; do not silently rewrite it');
  const chunkCount = Math.ceil(words.length / 18);
  const result = [];
  let consumed = 0;
  for (let i = 0; i < chunkCount; i++) {
    const size = Math.floor(words.length / chunkCount) + (i < words.length % chunkCount ? 1 : 0);
    const next = consumed + size;
    const timestamp = count => count === words.length ? end : Number((start + (end - start) * count / words.length).toFixed(6));
    result.push({ start: timestamp(consumed), end: timestamp(next), text: words.slice(consumed, next).join(' ') });
    consumed = next;
  }
  assert.equal(result.map(caption => caption.text).join(' '), narration, 'Caption words changed');
  return result;
}

export function buildOpeningScore(sourceBytes = readFileSync(path.join(repoRoot, sourcePath))) {
  assert(Buffer.isBuffer(sourceBytes), 'Read the actual source score bytes');
  const sourceText = sourceBytes.toString('utf8');
  // Re-run the existing compiler's script, review-hash, chapter-anchor and byte checks.
  checkScore(sourceText, buildProductionDraft());
  const source = JSON.parse(sourceText);
  const draft = source.productionDraft;
  assert.equal(draft.activeForPlayback, false, 'Do not activate the whole production draft');
  assert.deepEqual(draft.sequences.slice(0, 4).map(sequence => sequence.key), keys, 'Opening selection/order changed');
  assert.equal(source.sourceRevision, draft.sourceRevision, 'Source snapshot disagreement');
  assert.equal(source.model.physicalTime, false, 'Run B ticks must not acquire physical time');
  assert.match(source.model.sha256, /^[a-f0-9]{64}$/, 'Missing model identity');
  assert(source.model.bytes > 0 && source.visualDirection?.look, 'Missing prototype model/look');
  assert.equal(source.capture.audioSampleRate, 48000, 'Opening timing fixture requires 48 kHz');
  const sequences = draft.sequences.slice(0, 4);
  const cues = [];
  for (const sequence of sequences) {
    assert.equal(sequence.rows.length, 5, `Opening expects five reviewed rows in ${sequence.key}`);
    for (const [index, row] of sequence.rows.entries()) {
      assert.equal(row.id, `${sequence.key}-${String(index + 1).padStart(2, '0')}`, 'Row identity changed');
      assert.equal(row.startSeconds, cues.at(-1)?.end ?? 0, 'Opening row gap or overlap');
      const [theme, title] = direction[sequence.key][index];
      const isModel = sequence.key === 'S00' && index < 2;
      cues.push({
        id: row.id, sequenceKey: sequence.key, start: row.startSeconds, end: row.endSeconds,
        title, eyebrow: sequence.title, kind: isModel ? 'model' : 'diagram',
        narration: row.narration, description: row.onScreen,
        qualification: isModel
          ? 'MODEL · UNVALIDATED. The seed contains nineteen model cells, not molecules. G-G ticks are not physical seconds; no natural temperature is assigned. The cropped preview is not the completed-crystal reveal.'
          : `DIAGRAM · qualitative, not measured data or a molecular simulation. ${qualifiers[sequence.key]}`,
        sources: sequence.sources.map(({ path: sourceFile, anchor }) => ({ path: sourceFile, anchor })),
        sourceBindings: copy(sequence.sources), sourceBindingText: sequence.sourceBindingText, sourceScope: sequence.sourceScope,
        scriptLine: row.scriptLine,
        review: 'Narration and original ON SCREEN text are source-reviewed at the bound script identity; generated caption timing and visual implementation remain provisional.',
        visual: { component: isModel ? 'RunB' : 'OpeningDiagram', theme, origin: isModel ? 'identified project replay' : 'original authored diagram', progress: [0, 1], ...(isModel ? { ticks: index === 0 ? [28000, 32000] : [0, 7000] } : {}) },
        captions: provisionalCaptions(row.narration, row.startSeconds, row.endSeconds)
      });
    }
  }
  assert.equal(cues.length, 20, 'Expected twenty opening rows');
  assert.equal(cues.at(-1).end, 520, 'Opening must end at the reviewed S05 endpoint');
  const shots = [
    { time: 0, tick: 28000, tilt: 24, yaw: 210, span: 0.42, minimum: 8, target: 0.7 },
    { time: 25, tick: 32000, tilt: 20, yaw: 210, span: 0.46, minimum: 8, target: 0.72 },
    { time: 30, tick: 0, tilt: 12, yaw: 210, span: 2, minimum: 8, target: 0, cut: true },
    { time: 38, tick: 500, tilt: 12, yaw: 210, span: 2, minimum: 8, target: 0 },
    { time: 52, tick: 5500, tilt: 8, yaw: 210, span: 2, minimum: 8, target: 0 },
    { time: 60, tick: 7000, tilt: 0, yaw: 210, span: 3.4, minimum: 8, target: 0 },
    { time: 520, tick: 7000, tilt: 0, yaw: 210, span: 3.4, minimum: 8, target: 0 }
  ];
  return {
    format: source.format, edition: 'opening-chapter',
    status: 'WP4/WP5 opening chapter; reviewed narration draft with timing-only audio; maker read, recording and finished-film acceptance pending',
    title: 'How a snowflake is made — opening chapter', duration: 520, sourceRevision: draft.sourceRevision,
    script: 'Reviewed S00, S01, S02 and S05 narration is copied unchanged from productionDraft; this prepared opening does not activate the full film.',
    provenance: { generator: 'scripts/build-part1-opening-score.mjs', sourceScore: { path: sourcePath, sha256: sha256(sourceBytes), bytes: sourceBytes.length }, sourceDraftFormat: draft.format, sourceRevision: draft.sourceRevision, script: copy(draft.script), review: copy(draft.review), selectedSequenceKeys: keys, sourceDraftActiveForPlayback: false },
    captionStatus: { kind: 'provisional-word-weighted-timing', maximumChunkWords: 18, timing: 'Balanced word chunks occupy proportional shares of their reviewed row; six-decimal global seconds, not audio-aligned captions.', makerAudioAligned: false, text: 'Exact narration words and order preserved; silent holds have no captions.' },
    audio: { id: 'part1-opening-timing', url: '/film/part1-opening-timing.wav', offset: 0, trim: 0, duration: 520, kind: "generated timing tones; no speech; not the maker's voice", sampleRate: 48000 },
    capture: copy(source.capture), model: copy(source.model),
    visualDirection: { revision: 'opening-chapter-directed-attention-v1', contract: 'Presentation-only camera and lighting. Smoothstep between keys; the cut at 30 seconds holds the preceding cropped preview until returning to the seed. Target is a fraction of measured model radius toward the right-facing corner. No physical camera scale or growth rate is implied. The completed crystal is not revealed in this opening.', look: copy(source.visualDirection.look), shots },
    cues
  };
}

export const serializeOpeningScore = score => JSON.stringify(score, null, 2) + '\n';
export function checkOpeningScore(outputBytes, expected) {
  assert.equal(outputBytes.toString('utf8'), serializeOpeningScore(expected), 'Opening score has byte or provenance drift; regenerate from the reviewed source');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    assert(process.argv.length <= 3 && (!process.argv[2] || process.argv[2] === '--check'), 'Usage: node scripts/build-part1-opening-score.mjs [--check]');
    const score = buildOpeningScore();
    if (process.argv[2] === '--check') {
      checkOpeningScore(readFileSync(path.join(repoRoot, outputPath)), score);
      console.log(`Opening score current: ${score.cues.length} rows; ${score.duration}s; ${score.cues.reduce((n, cue) => n + cue.captions.length, 0)} provisional captions; script SHA-256 ${score.provenance.script.sha256}`);
    } else process.stdout.write(serializeOpeningScore(score));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
