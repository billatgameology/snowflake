import { readGrowthStudy } from "./growth-study-data.ts";
import { buildGrowthStatistics } from "./growth-statistics.ts";

self.onmessage = (event: MessageEvent<ArrayBuffer>) => {
  try {
    const data = readGrowthStudy(event.data);
    const statistics = buildGrowthStatistics(data);
    self.postMessage({ data: { ...data, statistics } }, { transfer: [data.positions.buffer, data.ticks.buffer,
      statistics.counts.buffer, statistics.reach.buffer, statistics.reachEvents.buffer, statistics.reachValues.buffer] });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : String(error) });
  }
};
