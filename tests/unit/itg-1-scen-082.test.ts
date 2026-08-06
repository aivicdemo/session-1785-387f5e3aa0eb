import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { sendConfirmationEmail } from "../../src/logic/it-2";

const fetchMock = require("jest-fetch-mock");

describe("確認メール自動配信機能", () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-082
  it("送信者の部門情報が null のときエラーをスロー", async () => {
    // Arrange: 部門情報が null の送信者オブジェクトを作成
    const sender = {
      userId: "user-001",
      name: "山田太郎",
      email: "yamada@example.com",
      department: null,
    };

    const report = {
      reportId: "report-001",
      previousAchievements: "昨日は機能Aを実装",
      todayPlans: "本日は機能Bをテスト",
      challenges: "データベース接続の最適化が課題",
    };

    const managerEmail = "manager@example.com";

    // Act & Assert: 部門情報が null なため、エラーがスローされることを確認
    await expect(
      sendConfirmationEmail(sender, report, managerEmail)
    ).rejects.toThrow(/部門/);

    // メール送信が実行されないことを確認
    expect(fetchMock.mock.calls.length).toBe(0);
  });
});