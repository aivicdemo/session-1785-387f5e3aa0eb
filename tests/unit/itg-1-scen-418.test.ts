import { describe, test, expect } from "@jest/globals";
import { shouldEndPromptionLoop } from "../../src/logic/it-1-br-1-1-1";

describe("催促ループ終了判定機能", () => {
  test("SCEN-418: 現在時刻が null のときエラーになる", () => {
    const lastPromptedAt = new Date("2024-01-15T08:30:00Z");
    const currentTime = null;
    const maxPromptAttempts = 3;
    const promptIntervalMinutes = 5;

    expect(() =>
      shouldEndPromptionLoop(
        lastPromptedAt,
        currentTime,
        maxPromptAttempts,
        promptIntervalMinutes
      )
    ).toThrow(/現在時刻/);
  });
});