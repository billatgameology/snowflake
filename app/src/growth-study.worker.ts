import { readGrowthStudy } from "./growth-study-data.ts";

self.onmessage = (event: MessageEvent<ArrayBuffer>) => {
  try {
    const data = readGrowthStudy(event.data);
    self.postMessage({ data }, { transfer: [data.positions.buffer, data.ticks.buffer] });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : String(error) });
  }
};
