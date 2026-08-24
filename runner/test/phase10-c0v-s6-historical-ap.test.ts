import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE10_C0V_S6_RECOVERY_V6_ACCEPTED_AP_ARTIFACTS,
  PHASE10_C0V_S6_RECOVERY_V6_ACCEPTED_AP_BYTES,
  PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_AP_PROTOCOL,
} from "../src/phase10-c0v-s6-contracts.ts";
import {
  independentlyReopenPhase10C0VS6AcceptedHistoricalApPacket,
} from "../src/phase10-c0v-s6-published-packet.ts";

const ROOT = resolve(import.meta.dirname, "../..");

describe("Phase 10 C0V S6 accepted historical A-P reopen", () => {
  it("reopens the complete accepted prefix through its retained V5 protocol and exact 15 paths", () => {
    const reopened = independentlyReopenPhase10C0VS6AcceptedHistoricalApPacket(ROOT);
    expect(reopened.packet.packetId).toBe("a-p-c0v-s6");
    expect(reopened.packet.protocolId).toBe("phase10-a-p-c0v-s6-execution-v2-recovery-v5");
    expect(reopened.preflight.observed.packetProtocol)
      .toEqual(PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_AP_PROTOCOL);
    expect(reopened.retainedPhysicalPaths)
      .toEqual(PHASE10_C0V_S6_RECOVERY_V6_ACCEPTED_AP_ARTIFACTS.map((entry) => entry.path));
    expect(reopened.finalizedPacketRetainedBytes).toBe(PHASE10_C0V_S6_RECOVERY_V6_ACCEPTED_AP_BYTES);
    expect(reopened.governedElapsedNanoseconds).toBe(141_142_452_500);
  }, 600_000);
});
