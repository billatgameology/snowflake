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
    // The default fork transport can time out its onTaskUpdate RPC on Windows after
    // the CPU-heavy Phase 4 suites have already passed. A single thread worker keeps
    // the suite deterministic, avoids that transport-only failure, and does not skip
    // or weaken any test.
    pool: "threads",
    fileParallelism: false,
    maxWorkers: 1,
  },
});
