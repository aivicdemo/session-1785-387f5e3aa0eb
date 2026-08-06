import { describe, test, expect } from "@jest/globals";
import { shouldTerminateReminder } from "../../src/logic/it-1-br-1-1-1";

describe("催促ループ終了判定機能", () => {
  // SCEN-412
  test("催促試行回数が負の数のときエラーをスロー", () => {
    const negativeRetryCount = -1;
    const maxRetries = 3;
    const remindedAt = new Date("2024-01-15T09:00:00Z");
    const now = new Date("2024-01-15T09:15:00Z");

    expect(() =>
      shouldTerminateReminder({
        retryCount: negativeRetryCount,
        maxRetries: maxRetries,
        remindedAt: remindedAt,
        currentTime: now,
      })
    ).toThrow(/催促試行回数は0以上/);
  });
});