import { sendConfirmationEmailsToReporterAndManager } from "../../src/logic/it-1-br-1-1-1";

describe("報告送信時に、送信者本人と部長宛に確認メールを自動配信する機能", () => {
  // SCEN-456: [error] 報告到着状況把握機能 - 確認メール受信日時が不正な日時形式のとき、エラーになる
  test("確認メール受信日時が不正な日時形式のとき、エラーになる", () => {
    const invalidDateFormats = [
      "2024/13/45",
      "2024-13-01",
      "abc",
      "2024-01-32",
      "invalid-date",
      "2024/01/01",
      "",
      "2024-13-01T10:00:00Z",
    ];

    invalidDateFormats.forEach((invalidFormat) => {
      expect(() =>
        sendConfirmationEmailsToReporterAndManager({
          reporterId: "user-001",
          reporterEmail: "engineer@example.com",
          managerEmail: "manager@example.com",
          confirmationMailReceivedAt: invalidFormat,
          reportContent: {
            yesterdayAccomplishment: "実装完了",
            todayPlan: "テスト実施",
            issues: "なし",
          },
        })
      ).toThrow(/確認メール受信日時の形式が不正/);
    });
  });
});