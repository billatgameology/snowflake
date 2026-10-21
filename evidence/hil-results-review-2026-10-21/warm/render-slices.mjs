// Actual terminal occupancy in the central j plane. Shared physical axes, unequal terminal ages.
import fs from 'node:fs';
import path from 'node:path';
import { domainCenter, hexSeedSites, coordsOf } from '@vcc/core';
const [campaignDirectory, output] = process.argv.slice(2);
if (!campaignDirectory || !output) throw new Error('Usage: node render-slices.mjs <warm-campaign> <new-output.svg>');
const configurations = ['coarse', 'fine-thin', 'fine-thick'];
const scale = 22, panel = 250, left = 57, top = 86, rowHeight = 310;
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="870" height="735" viewBox="0 0 870 735"><rect width="870" height="735" fill="white"/><g font-family="Arial,sans-serif" fill="#14212e"><text x="35" y="28" font-size="20">Warm growth after an early intervention</text><text x="35" y="50" font-size="13">Terminal central-plane occupancy (j = center); shared physical axes, unequal ages</text>`;
for (let row = 0; row < 2; row++) for (let column = 0; column < 3; column++) {
  const arm = row === 0 ? 'broad' : 'early', id = `warm-refine-${configurations[column]}-t4p5-${arm}`;
  const directory = path.join(campaignDirectory, 'rows', id), spec = JSON.parse(fs.readFileSync(path.join(directory, 'spec.json'))).row;
  const result = JSON.parse(fs.readFileSync(path.join(directory, 'result.json'))), dims = { nx: spec.dimsN, ny: spec.dimsN, nz: spec.dimsN }, center = domainCenter(dims);
  const occupied = new Set(hexSeedSites(dims, spec.seedRadius, spec.seedThickness));
  for (const line of fs.readFileSync(path.join(directory, 'events.jsonl'), 'utf8').trim().split(/\r?\n/)) for (const site of JSON.parse(line).attached) occupied.add(site.index);
  if (occupied.size !== result.attachedCount) throw new Error('Terminal occupancy count mismatch: ' + id);
  const x0 = left + column * (panel + 28), y0 = top + row * rowHeight, cx = x0 + panel / 2, cy = y0 + panel / 2;
  svg += `<text x="${x0}" y="${y0 - 15}" font-size="14">${configurations[column]} / ${arm === 'early' ? 'early only' : 'broad'}</text><rect x="${x0}" y="${y0}" width="${panel}" height="${panel}" fill="#f3f6f8" stroke="#c9d1d8"/>`;
  for (const index of occupied) {
    const xyz = coordsOf(dims, index); if (xyz[1] !== center[1]) continue;
    const x = cx + (xyz[0] - center[0] - .5) * spec.dxUm * scale, y = cy - (xyz[2] - center[2] + .5) * spec.dxUm * scale;
    svg += `<rect x="${x.toFixed(3)}" y="${y.toFixed(3)}" width="${(spec.dxUm * scale).toFixed(3)}" height="${(spec.dxUm * scale).toFixed(3)}" fill="${row === 0 ? '#285b7c' : '#b56127'}"/>`;
  }
  for (const tick of [-4, 0, 4]) svg += `<text x="${cx + tick * scale - 5}" y="${y0 + panel + 15}" font-size="11">${tick}</text><text x="${x0 - 22}" y="${cy - tick * scale + 4}" font-size="11">${tick}</text>`;
  svg += `<text x="${x0 + panel - 20}" y="${y0 + panel + 15}" font-size="11">um</text><text x="${x0 + 4}" y="${y0 + 17}" font-size="11">${result.simTimeSeconds.toFixed(3)} s</text>`;
}
svg += '<text x="35" y="710" font-size="12">Each square marks one occupied lattice cell in this slice; these are model observations, not measured ice.</text></g></svg>';
fs.writeFileSync(output, svg + '\n', { flag: 'wx' });
console.log(JSON.stringify({ output: path.resolve(output), panels: 6 }));
