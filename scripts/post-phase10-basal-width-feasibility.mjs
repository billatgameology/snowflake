// Retained-occupancy analysis only: no solver import or simulated evolution.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';

const output = process.argv[2];
if (!output) throw new Error('usage: node scripts/post-phase10-basal-width-feasibility.mjs <output.json>');
const directions = [[1, 0], [0, 1], [1, -1], [-1, 0], [0, -1], [-1, 1]];
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const sources = [];
function readJson(path) {
  const bytes = readFileSync(path);
  sources.push({ path, sha256: sha256(bytes) });
  return JSON.parse(bytes.toString('utf8'));
}
function increment(histogram, key) { histogram[key] = (histogram[key] ?? 0) + 1; }
function summary(cells) {
  const widths = {};
  for (const cell of cells) increment(widths, cell.L);
  return { count: cells.length, widthHistogram: widths,
    le2: cells.filter(cell => cell.L <= 2).length,
    le3: cells.filter(cell => cell.L <= 3).length,
    attachesWithinNext20Cycles: cells.filter(cell => cell.attachesWithinNext20Cycles).length,
    le2AttachesWithinNext20Cycles: cells.filter(cell => cell.L <= 2 && cell.attachesWithinNext20Cycles).length,
    le3AttachesWithinNext20Cycles: cells.filter(cell => cell.L <= 3 && cell.attachesWithinNext20Cycles).length };
}

const rows = [];
for (const tag of ['t4p5', 't5']) {
  const reportPath = `out/post-phase10-facet-factorial/${tag}-long-comparison-2026-09-10.json`;
  const priorReport = readJson(reportPath);
  for (const arm of ['nodip', 'basal-only']) {
    const rowId = arm === 'nodip' ? `followup-larger-cavity-${tag}-f0p075-nodip` : `facet-isolation-long-${tag}-basal-only`;
    const root = arm === 'nodip' ? 'out/post-phase10-followup/campaign-2026-09-03-wave2/rows' : 'out/post-phase10-facet-factorial/campaign-long-2026-09-09/rows';
    const rowDir = `${root}/${rowId}`;
    const spec = readJson(`${rowDir}/spec.json`);
    const result = readJson(`${rowDir}/result.json`);
    const bytes = readFileSync(`${rowDir}/events.jsonl`);
    sources.push({ path: `${rowDir}/events.jsonl`, sha256: sha256(bytes) });
    const events = bytes.toString('utf8').trim().split('\n').map(line => JSON.parse(line));
    const old = priorReport.rows.find(row => row.rowId === rowId).analysis;
    const n = spec.row.dimsN, center = Math.floor(n / 2), plane = n * n;
    const occupied = new Set();
    const indexOf = (i, j, k) => i + n * j + plane * k;
    const coords = index => [index % n, Math.floor(index / n) % n, Math.floor(index / plane)];
    const inPlaneRadius = (i, j) => Math.max(Math.abs(i - center), Math.abs(j - center), Math.abs(i + j - 2 * center));
    for (let dk = -(spec.row.seedThickness - 1) / 2; dk <= (spec.row.seedThickness - 1) / 2; dk++) {
      for (let di = -spec.row.seedRadius; di <= spec.row.seedRadius; di++) for (let dj = -spec.row.seedRadius; dj <= spec.row.seedRadius; dj++) {
        if (Math.max(Math.abs(di), Math.abs(dj), Math.abs(di + dj)) <= spec.row.seedRadius) occupied.add(indexOf(center + di, center + dj, center + dk));
      }
    }
    const attachmentCycle = new Map(events.flatMap(event => event.attached.map(site => [site.index, event.cycle])));
    const samples = new Map([[0, ['seed']]]);
    function select(cycle, label) { samples.set(cycle, [...(samples.get(cycle) ?? []), label]); }
    select(events.find(event => event.attached.length > 0).cycle, 'first-attachment');
    select(old.firstLaterallyEnclosedCenter.cycle, 'first-enclosure');
    if (old.terminalEnclosureEpisode) select(old.terminalEnclosureEpisode.start.cycle, 'terminal-episode-start');
    for (const extent of [7, 15, 23, 31]) select(events.find(event => event.extent >= extent).cycle, `first-extent-${extent}`);
    select(events.at(-1).cycle, 'terminal');

    function basalSupports(index) {
      const [i, j, k] = coords(index);
      if (occupied.has(index) || directions.some(([di, dj]) => occupied.has(indexOf(i + di, j + dj, k)))) return [];
      return [-1, 1].filter(sign => occupied.has(index - sign * plane)).map(sign => ({ index: index - sign * plane, sign }));
    }
    function width(support, sign) {
      const [i, j, k] = coords(support);
      const exposed = (ii, jj) => occupied.has(indexOf(ii, jj, k)) && !occupied.has(indexOf(ii, jj, k + sign));
      const chords = directions.slice(0, 3).map(([di, dj]) => {
        let length = 1;
        for (const orientation of [-1, 1]) for (let step = 1; exposed(i + step * orientation * di, j + step * orientation * dj); step++) length++;
        return length;
      });
      return Math.min(...chords);
    }
    function snapshot(event) {
      const componentOfFace = new Map(), components = [];
      const occupiedK = [...occupied].map(index => coords(index)[2]);
      const lower = Math.min(...occupiedK), upper = Math.max(...occupiedK);
      for (const index of occupied) for (const sign of [-1, 1]) {
        if (occupied.has(index + sign * plane) || componentOfFace.has(`${sign}:${index}`)) continue;
        const component = { id: components.length, sign, supportOffset: coords(index)[2] - center, size: 0, containsAxis: false, enclosesAxis: false, minimumRadius: Infinity, maximumRadius: 0 };
        const stack = [index], members = new Set([index]);
        componentOfFace.set(`${sign}:${index}`, component.id);
        while (stack.length) {
          const cell = stack.pop(), [i, j, k] = coords(cell);
          component.size++;
          component.containsAxis ||= i === center && j === center;
          component.minimumRadius = Math.min(component.minimumRadius, inPlaneRadius(i, j));
          component.maximumRadius = Math.max(component.maximumRadius, inPlaneRadius(i, j));
          for (const [di, dj] of directions) {
            const neighbor = indexOf(i + di, j + dj, k);
            if (occupied.has(neighbor) && !occupied.has(neighbor + sign * plane) && !members.has(neighbor)) {
              members.add(neighbor); componentOfFace.set(`${sign}:${neighbor}`, component.id); stack.push(neighbor);
            }
          }
        }
        if (!component.containsAxis) {
          const k = component.supportOffset + center, bound = component.maximumRadius + 1;
          const airStack = [indexOf(center, center, k)], seen = new Set(airStack);
          let escaped = false;
          while (airStack.length && !escaped) {
            const cell = airStack.pop(), [i, j] = coords(cell);
            if (inPlaneRadius(i, j) >= bound) { escaped = true; break; }
            for (const [di, dj] of directions) {
              const neighbor = indexOf(i + di, j + dj, k);
              if (!members.has(neighbor) && !seen.has(neighbor)) { seen.add(neighbor); airStack.push(neighbor); }
            }
          }
          component.enclosesAxis = !escaped;
        }
        component.kind = component.size === 1 ? 'single-site-patch' : component.containsAxis ? 'axis-containing-patch' : component.enclosesAxis ? 'axis-encircling-terrace' : 'off-axis-patch';
        component.depthBelowAxialEnvelope = component.sign === 1 ? upper - center - component.supportOffset : component.supportOffset + center - lower;
        components.push(component);
      }
      const candidates = new Set([...occupied].flatMap(index => [index - plane, index + plane]));
      const cells = [];
      for (const index of candidates) {
        const supports = basalSupports(index);
        if (!supports.length) continue;
        const [i, j, k] = coords(index);
        const faces = supports.map(support => ({ componentId: componentOfFace.get(`${support.sign}:${support.index}`), sign: support.sign, L: width(support.index, support.sign) }));
        const nextCycle = attachmentCycle.get(index);
        cells.push({ index, relativeCoords: [i - center, j - center, k - center], raw: supports.length === 1 ? '01' : '02', L: Math.min(...faces.map(face => face.L)), faces,
          attachesWithinNext20Cycles: nextCycle !== undefined && nextCycle > event.cycle && nextCycle <= event.cycle + 20 });
      }
      const byRaw = Object.fromEntries(['01', '02'].map(raw => [raw, summary(cells.filter(cell => cell.raw === raw))]));
      const byComponent = components.map(component => ({ ...component, basalBoundary: summary(cells.filter(cell => cell.faces.some(face => face.componentId === component.id))) })).filter(component => component.basalBoundary.count > 0);
      const bySpatialKind = Object.fromEntries(['single-site-patch', 'axis-containing-patch', 'axis-encircling-terrace', 'off-axis-patch'].map(kind => [kind, summary(cells.filter(cell => cell.faces.some(face => components[face.componentId].kind === kind)))]));
      return { labels: samples.get(event.cycle), cycle: event.cycle, simTimeSeconds: event.simTimeSeconds, extent: event.extent, attachedCount: occupied.size, axialOffsets: [lower - center, upper - center],
        byRaw, bySpatialKind, byComponent, centralRadius1Cells: cells.filter(cell => inPlaneRadius(cell.relativeCoords[0] + center, cell.relativeCoords[1] + center) <= 1),
        topEnvelopeCells: cells.filter(cell => cell.faces.some(face => components[face.componentId].depthBelowAxialEnvelope === 0)),
        cells };
    }
    const frames = [snapshot({ cycle: 0, simTimeSeconds: 0, extent: 2 * spec.row.seedRadius + 1 })];
    const attachedBasal = { '01': {}, '02': {} };
    let basalFacetMismatch = 0;
    for (const event of events) {
      for (const site of event.attached) if (site.facetBeforeAttachment === 'basal') {
        const supports = basalSupports(site.index);
        if (!supports.length) basalFacetMismatch++;
        else increment(attachedBasal[supports.length === 1 ? '01' : '02'], Math.min(...supports.map(support => width(support.index, support.sign))));
      }
      for (const site of event.attached) occupied.add(site.index);
      if (samples.has(event.cycle)) frames.push(snapshot(event));
      if (occupied.size !== event.attachedCount) throw new Error(`occupancy mismatch: ${rowId} ${event.cycle}`);
    }
    rows.push({ rowId, row: spec.row, status: { admissible: result.admissible, stopReason: result.stopReason }, observedBasalAttachmentsByPreUpdateWidth: attachedBasal, basalFacetMismatch, frames });
  }
}
const report = { schema: 'post-phase10-basal-width-geometry-feasibility-v1', generatedAt: new Date().toISOString(),
  command: process.argv, helperSha256: sha256(readFileSync(new URL(import.meta.url))),
  definitions: {
    scope: 'Retained attached occupancy, four completed N80 rows; no solver or field replay.',
    width: 'L is the minimum of three opposite-direction inclusive contiguous chord counts on the same-height exposed attached-support face. W = L * dxUm is a mesoscopic P4 proxy, not molecular terrace width.',
    doubleBasal: 'Raw [02] uses minimum across both exposed support faces. Components count face incidences; [02] can occur in multiple spatial groups.',
    time: 'Each frame is the geometry AFTER the named interface update. Recorded attachment-width counts use the geometry BEFORE that update.',
    enclosureSelection: 'First/terminal episode start cycles selected from named existing comparison reports, not redetected by this helper.',
    componentKind: 'Connected components of a signed same-height exposed-face mask. Axis-encircling means this mask alone blocks in-plane escape of the axis; it is not a 3D air-cavity classification.',
    growthProxy: 'attachesWithinNext20Cycles counts currently basal sites that later attach in the observed trajectory, possibly after becoming rough. It is not a kinetic-demand, fill-history or physical-time weighting; the terminal window is unavailable.',
    limits: 'Snapshots and attachment labels cannot reconstruct per-site kinetic demand or partial fill. Off-axis patches can be rim segments or terraces; their label alone does not identify molecular islands.' },
  sources, rows };
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ output, rows: rows.map(row => ({ rowId: row.rowId, frames: row.frames.length, basalFacetMismatch: row.basalFacetMismatch, terminal: row.frames.at(-1).byRaw, observedBasalAttachmentsByPreUpdateWidth: row.observedBasalAttachmentsByPreUpdateWidth })) }, null, 2));
