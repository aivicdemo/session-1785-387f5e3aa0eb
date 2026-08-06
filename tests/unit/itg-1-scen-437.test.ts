import { determineChallengeLoopEnd } from "../../src/logic/it-1-br-1-1-1";

describe("催促ループ終了判定機能", () => {
  // SCEN-437
  test("再報告待機時間が一定時間未満の時点では催促を継続する", () => {
    const lastPromptSentAt = new Date("2024-01-15T09:30:00Z");
    const currentTime = new Date("2024-01-15T10:00:00Z");
    const waitThresholdMinutes = 60;

    const result = determineChallengeLoopEnd({
      lastPromptSentAt,
      currentTime,
      waitThresholdMinutes,
    });

    expect(result).toBe(false);
  });
});