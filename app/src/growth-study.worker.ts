import { readDendrite } from "./dendrite-data.ts";

self.onmessage = (event: MessageEvent<ArrayBuffer>) => {
  try {
    const data = readDendrite(event.data);
    self.postMessage({ data }, { transfer: [data.positions.buffer, data.ticks.buffer] });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : String(error) });
  }
};
