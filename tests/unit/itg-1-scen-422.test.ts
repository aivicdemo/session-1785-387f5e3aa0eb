import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";

describe("IT-1-BR-1-1-1: 催促ループ終了判定機能", () => {
  let mockCurrentTime: Date;

  beforeEach(() => {
    mockCurrentTime = new Date("2024-01-15T09:00:00Z");
    jest.useFakeTimers();
    jest.setSystemTime(mockCurrentTime);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // SCEN-422: [error] 催促ループ終了判定機能 - 最後の再報告受信時刻が現在時刻より後の時刻のときエラーになる
  test("should throw error when lastFollowUpReportReceivedAt is in the future", async () => {
    const { determinePromptLoopEnd } = await import(
      "../../src/logic/it-1-br-1-1-1"
    );

    const lastFollowUpReportReceivedAt = new Date(
      "2024-01-15T09:30:00Z"
    );
    const baseTimeForComparison = mockCurrentTime;

    expect(() => {
      determinePromptLoopEnd({
        lastFollowUpReportReceivedAt,
        baseTimeForComparison,
      });
    }).toThrow(/再報告受信時刻/);
  });
});