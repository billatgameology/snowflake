#!/usr/bin/env node
// Compile the text-only production draft, never the frozen WP0A playback snapshot.
// No arguments: print productionDraft JSON. --check: reject score-member byte drift.
// This command does not write files. Apply its output to the score with a reviewed patch.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scriptPath = 'docs/video/part1-script.md';
const scorePath = 'docs/video/part1-score.json';
const reviewPath = 'docs/reviews/film-part1-script-review-2026-09-15.md';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const countWords = text => text.split(/\s+/u).filter(word => /[\p{L}\p{N}]/u.test(word)).length;
const seconds = time => {
  assert.match(time, /^\d{2}:[0-5]\d$/, `Invalid timecode: ${time}`);
  const [minutes, remainder] = time.split(':').map(Number);
  return minutes * 60 + remainder;
};
const sourceCache = new Map();

function sourceReference(label, href, revision) {
  const [relativePath, anchor = '', ...extra] = href.split('#');
  assert.equal(extra.length, 0, `Invalid source URL: ${href}`);
  const resolvedPath = path.posix.normalize(path.posix.join(path.posix.dirname(scriptPath), relativePath));
  assert(!path.posix.isAbsolute(resolvedPath) && !resolvedPath.startsWith('../') && !relativePath.includes(':'), `Non-local source: ${href}`);
  const cacheKey = `${revision}:${resolvedPath}`;
  if (!sourceCache.has(cacheKey)) {
    const bytes = execFileSync('git', ['show', cacheKey], { cwd: repoRoot, maxBuffer: 16 * 1024 * 1024 });
    sourceCache.set(cacheKey, bytes);
  }
  const bytes = sourceCache.get(cacheKey);
  const isChapter = resolvedPath.startsWith('docs/education/chapters/');
  if (isChapter) {
    assert.match(resolvedPath, /\/(?:0[1-9]|1[0-3])-[^/]+\.html$/, `Outside selected chapters: ${resolvedPath}`);
    assert(anchor, `Chapter reference needs an anchor: ${href}`);
    const ids = Array.from(bytes.toString('utf8').matchAll(/\bid\s*=\s*["']([^"']+)["']/g), match => match[1]);
    assert(ids.includes(anchor), `Missing chapter anchor: ${resolvedPath}#${anchor}`);
    assert(readFileSync(path.join(repoRoot, resolvedPath)).equals(bytes), `Chapter differs from source snapshot: ${resolvedPath}`);
  }
  return { label, path: resolvedPath, anchor, revision, sha256: sha256(bytes), bytes: bytes.length, kind: isChapter ? 'chapter' : 'supporting-record' };
}

function originalSceneKeys(bindingText) {
  const clause = /^Source scenes: ([\s\S]*?)Bindings:/.exec(bindingText)?.[1];
  assert(clause, 'Scene needs a Source scenes / Bindings declaration');
  const result = new Set();
  for (const match of clause.matchAll(/S(\d{2})(?:[–-]S(\d{2}))?/g)) {
    const first = Number(match[1]);
    const last = Number(match[2] ?? match[1]);
    assert(last >= first && last <= 34, `Invalid source scene range: ${match[0]}`);
    for (let n = first; n <= last; n++) result.add(`S${String(n).padStart(2, '0')}`);
  }
  assert(result.size, 'Scene has no original source scene keys');
  return [...result];
}

export function buildProductionDraft(scriptBytes = readFileSync(path.join(repoRoot, scriptPath)), reviewBytes = readFileSync(path.join(repoRoot, reviewPath))) {
  assert(Buffer.isBuffer(scriptBytes), 'Pass actual script bytes as a Buffer');
  assert(Buffer.isBuffer(reviewBytes), 'Pass actual review bytes as a Buffer');
  const markdown = scriptBytes.toString('utf8');
  const reviewText = reviewBytes.toString('utf8');
  const currentReviewIdentities = [...reviewText.matchAll(/Current reviewed script SHA-256: `([a-f0-9]{64})`/g)];
  assert.equal(currentReviewIdentities.length, 1, 'Review needs exactly one explicit Current reviewed script SHA-256');
  assert.equal(currentReviewIdentities[0][1], sha256(scriptBytes), 'Review names a different current script SHA-256');
  assert(/no recording-blocking scientific or source-fidelity issue\s+found/.test(reviewText), 'Review does not state the source-review disposition');
  const sourceRevision = /\*\*Source snapshot:\*\*[\s\S]*?`([a-f0-9]{40})`/.exec(markdown)?.[1];
  assert(sourceRevision, 'Missing full source-snapshot revision');
  const lines = markdown.split('\n');
  const sequences = [];
  const seenKeys = new Set();
  let globalEnd = 0;
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const heading = /^## (?:(S\d{2}) — (.+)|Credits and sources) · (\d{2}:\d{2})–(\d{2}:\d{2})$/.exec(line);
    if (!heading) {
      assert(!/^## S\d|^## Credits|^\|\s*\d{2}:/.test(line), `Malformed or unowned timeline at line ${index + 1}`);
      continue;
    }
    const key = heading[1] ?? 'credits';
    assert(!seenKeys.has(key), `Duplicate sequence key: ${key}`);
    assert(!seenKeys.has('credits'), 'Credits must be terminal');
    seenKeys.add(key);
    const startSeconds = seconds(heading[3]);
    const endSeconds = seconds(heading[4]);
    assert.equal(startSeconds, globalEnd, `Sequence gap/overlap: ${key}`);
    assert(endSeconds > startSeconds, `Nonpositive sequence duration: ${key}`);
    let next = index + 1;
    while (next < lines.length && !lines[next].startsWith('## ')) next++;
    const section = lines.slice(index + 1, next);
    const tableStart = section.findIndex(value => value === '| TIME | VOICEOVER | ON SCREEN |');
    assert(tableStart >= 0, `Missing exact three-column header: ${key}`);
    assert.equal(section[tableStart + 1], '|---|---|---|', `Invalid table divider: ${key}`);
    const bindingText = section.slice(0, tableStart).join('\n').trim();
    const scope = key === 'credits' ? 'Editorial credits and source locator; no final recording, public URL, rights clearance or publication claim.' : /Status: ([\s\S]+)$/.exec(bindingText)?.[1];
    assert(scope, `Missing source scope: ${key}`);
    const sourceScenes = key === 'credits' ? [] : originalSceneKeys(bindingText);
    assert(key === 'credits' || sourceScenes.includes(key), `Primary key absent from source scenes: ${key}`);
    const sources = [...bindingText.matchAll(/\[([^\]]+)\]\(([^\s()]+)\)/g)].map(match => sourceReference(match[1], match[2], sourceRevision));
    assert(key === 'credits' || sources.length > 0, `Missing local source bindings: ${key}`);
    let rowEnd = startSeconds;
    const rows = [];
    for (let offset = tableStart + 2; offset < section.length; offset++) {
      const row = section[offset];
      if (!row.trim()) continue;
      assert(row.startsWith('|') && row.endsWith('|'), `Unexpected content after table: ${key}`);
      const cells = row.slice(1, -1).split('|').map(value => value.trim());
      assert.equal(cells.length, 3, `Expected exactly three table cells at line ${index + offset + 2}`);
      const timing = /^(\d{2}:\d{2})–(\d{2}:\d{2})$/.exec(cells[0]);
      assert(timing, `Invalid row time range: ${cells[0]}`);
      const rowStart = seconds(timing[1]);
      const rowStop = seconds(timing[2]);
      assert.equal(rowStart, rowEnd, `Row gap/overlap: ${key} ${cells[0]}`);
      assert(rowStop > rowStart && rowStop <= endSeconds, `Row outside sequence: ${key} ${cells[0]}`);
      assert(cells[1] && cells[2], `Empty VOICEOVER/ON SCREEN cell: ${key}`);
      const narration = cells[1] === '—' ? '' : cells[1];
      const spokenWords = countWords(narration);
      assert(!narration || spokenWords > 0, `Invalid spoken row: ${key}`);
      rows.push({ id: `${key}-${String(rows.length + 1).padStart(2, '0')}`, scriptLine: index + offset + 2, startSeconds: rowStart, endSeconds: rowStop, durationSeconds: rowStop - rowStart, kind: narration ? 'narration' : 'silence', narration, onScreen: cells[2], spokenWords, audioRef: null, captionRef: null, visualRef: null });
      rowEnd = rowStop;
    }
    assert(rows.length, `Empty sequence: ${key}`);
    assert.equal(rowEnd, endSeconds, `Rows do not fill sequence: ${key}`);
    sequences.push({ key, originalSceneKey: heading[1] ?? null, title: heading[2] ?? 'Credits and sources', scriptHeadingLine: index + 1, startSeconds, endSeconds, durationSeconds: endSeconds - startSeconds, sourceSceneKeys: sourceScenes, sourceBindingText: bindingText, sourceScope: scope, sources, inheritedSourceSequenceKeys: /earlier\s+sequence/.test(bindingText) ? sequences.map(sequence => sequence.key) : [], media: { audio: { status: 'pending-maker-recording', ref: null }, captions: { status: 'pending-reviewed-audio-derived-timing', ref: null }, visuals: { status: 'pending-production-assets', ref: null } }, rows });
    globalEnd = endSeconds;
    index = next - 1;
  }
  assert.equal(sequences.at(-1)?.key, 'credits', 'Missing terminal credits');
  assert(sequences.length > 1 && globalEnd < 3600, 'Production timeline must be nonempty and strictly under one hour');
  const rows = sequences.flatMap(sequence => sequence.rows);
  const spokenRows = rows.filter(row => row.kind === 'narration');
  const spokenWords = rows.reduce((sum, row) => sum + row.spokenWords, 0);
  const declaredWords = /\*\*([\d,]+) spoken words\*\*/.exec(markdown)?.[1];
  assert(declaredWords, 'Missing draft word-count declaration');
  assert.equal(spokenWords, Number(declaredWords.replaceAll(',', '')), 'Declared VOICEOVER word count is stale');
  const declaredDuration = /proposed cut is \*\*(\d{2}:\d{2})\*\*/.exec(markdown)?.[1];
  assert(declaredDuration, 'Missing provisional duration declaration');
  assert.equal(globalEnd, seconds(declaredDuration), 'Declared duration is stale');
  return {
    format: 'part1-production-draft-v1',
    status: 'Provisional narration draft; not approved for recording or finished-film acceptance',
    activeForPlayback: false,
    script: { path: scriptPath, sha256: sha256(scriptBytes), bytes: scriptBytes.length },
    sourceRevision,
    timing: { kind: 'provisional-absolute-global-seconds', durationSeconds: globalEnd, includesHoldsAndCredits: true, makerTableRead: 'pending', actualRecordedTiming: 'pending', narrationRateIsMeasuredDelivery: false },
    review: { status: 'source-reviewed; maker-read-and-recording-pending', statusPointer: { path: reviewPath, anchor: 'verdict', sha256: sha256(reviewBytes), bytes: reviewBytes.length }, currentReviewedScriptSha256: currentReviewIdentities[0][1], scriptAgenda: { path: scriptPath, anchor: 'fact-check-and-production-handoff' }, note: 'Non-author source review binds these script bytes. It is not maker recording approval or acceptance of an unbuilt film; prototype playback retains its separate snapshot.' },
    statistics: { primaryScenes: sequences.length - 1, sequencesIncludingCredits: sequences.length, rows: rows.length, spokenRows: spokenRows.length, silentRows: rows.length - spokenRows.length, spokenWords, allocatedNarrationSeconds: spokenRows.reduce((sum, row) => sum + row.durationSeconds, 0), explicitSilenceSeconds: rows.filter(row => row.kind === 'silence').reduce((sum, row) => sum + row.durationSeconds, 0), maximumAllocatedRowWordsPerMinute: Math.max(...spokenRows.map(row => row.spokenWords * 60 / row.durationSeconds)), wordCountMethod: 'VOICEOVER cells only; whitespace tokens containing a Unicode letter or number; em-dash silence excluded' },
    sequences
  };
}

export const scoreMember = draft => '\n  "productionDraft": ' + JSON.stringify(draft, null, 2).replaceAll('\n', '\n  ');

export function checkScore(scoreText, expectedDraft) {
  const parsed = JSON.parse(scoreText);
  assert.deepEqual(parsed.productionDraft, expectedDraft, 'productionDraft differs from the current script/source compilation');
  const expectedMember = scoreMember(expectedDraft);
  assert(scoreText.endsWith(`${expectedMember}\n}\n`), 'productionDraft member has byte drift or is not the final root member');
  assert.equal(scoreText.split('\n  "productionDraft": ').length, 2, 'Duplicate productionDraft members');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    assert(process.argv.length <= 3 && (!process.argv[2] || process.argv[2] === '--check'), 'Usage: node scripts/build-part1-production-score.mjs [--check]');
    const draft = buildProductionDraft();
    if (process.argv[2] === '--check') {
      checkScore(readFileSync(path.join(repoRoot, scorePath), 'utf8'), draft);
      console.log(`productionDraft current: ${draft.statistics.spokenWords} VOICEOVER words; ${draft.statistics.primaryScenes} scenes + credits; ${draft.statistics.rows} rows; ${draft.timing.durationSeconds}s; script SHA-256 ${draft.script.sha256}`);
    } else process.stdout.write(JSON.stringify(draft, null, 2) + '\n');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
