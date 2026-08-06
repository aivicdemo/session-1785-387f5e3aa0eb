import { sendConfirmationEmailsToReporterAndManager } from "../../src/logic/it-1-br-1-1-1";

describe("報告送信時の確認メール自動配信機能", () => {
  // SCEN-385
  test("報告送信日時が空文字列のとき、期限判定が実行されない", () => {
    const reportId = "report_001";
    const reporterId = "engineer_001";
    const managerEmail = "manager@example.com";
    const reporterEmail = "engineer@example.com";
    const reportContent = {
      yesterday: "前日の実績",
      today: "本日の予定",
      issues: "抱えている課題",
    };
    const submittedAt = "";
    const deadlineTime = new Date("2024-01-15T09:00:00Z");

    expect(() =>
      sendConfirmationEmailsToReporterAndManager({
        reportId,
        reporterId,
        managerEmail,
        reporterEmail,
        reportContent,
        submittedAt,
        deadlineTime,
      })
    ).toThrow(/送信日時/);
  });
});