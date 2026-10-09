import fs from 'node:fs';
const report = JSON.parse(fs.readFileSync(process.argv[2] ?? 'out/hil-bld-joint-review-20261008/hil/analysis-v2.json'));
const checks = report.seeds.map((seed) => {
  const ranges = seed.commonAge.rows.map((row) => [row.atOrBefore.aspectRatio,
    row.nextEvent?.aspectRatio ?? row.atOrBefore.aspectRatio].sort((a, b) => a - b));
  const [both, neither, basal, prism] = ranges;
  return { tempC: seed.tempC, seed: [seed.radius, seed.thickness], bracketEndpointCombinations: {
    bothMinusNeither: [both[0] - neither[1], both[1] - neither[0]],
    basalOnlyMinusNeither: [basal[0] - neither[1], basal[1] - neither[0]],
    prismOnlyMinusNeither: [prism[0] - neither[1], prism[1] - neither[0]],
    interaction: [both[0] - basal[1] - prism[1] + neither[0], both[1] - basal[0] - prism[0] + neither[1]],
  } };
});
const result = { scope: 'Combinations of recorded bracketing endpoint values only; not bounds on interpolated or continuous dynamics', checks };
fs.writeFileSync(process.argv[3] ?? 'out/hil-bld-joint-review-20261008/hil/bracket-endpoint-sensitivity-rerun.json',
  JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
