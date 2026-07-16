import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "core/test/**/*.test.ts",
      "solver-cpu/test/**/*.test.ts",
      "runner/test/**/*.test.ts",
      "app/test/**/*.test.ts",
    ],
    // Long-running solver tests (mass conservation over thousands of ticks)
    // need more than the 5 s default.
    testTimeout: 120_000,
  },
});
