import { describe, test, expect } from "@jest/globals";
import { stopPromptingJudgment } from "../../src/logic/it-1-br-1-1-1";

describe("報告送信時に、送信者本人と部長宛に確認メールを自動配信する機能", () => {
  // SCEN-430
  test("自動催促停止判定機能 - 催促停止判定の対象部員IDが null のときエラーになる", () => {
    const request = {
      targetMemberId: null,
      promotionCount: 2,
      lastPromotionTime: new Date("2024-01-15T10:00:00Z"),
      maxPromotionAttempts: 3,
    };

    expect(() => stopPromptingJudgment(request)).toThrow(
      /部員ID|必須|null/i
    );
  });
});