import { validateAndSubmitDailyReport } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-160: [normal] 日報送信検証機能 - 3項目すべてが正常な形式と文字数で入力されたとき、送信処理に進む
  test("should proceed to send processing when all three items are valid", async () => {
    const userId = "ENG001";
    const submissionDate = "2024-01-15";
    const yesterdayAccomplishment =
      "データベース最適化タスクを完了し、クエリ応答時間を30%削減しました";
    const todayPlan =
      "API開発タスクを開始し、エンドポイント設計を完了する予定です";
    const challengesFaced =
      "外部APIの仕様確認に時間がかかっているため、ドキュメント確認を優先します";

    const mailSendLog: Array<{
      userId: string;
      submissionDate: string;
      recipientEmail: string;
      mailType: string;
      sentAt: string;
    }> = [];

    const mockMailSender = (
      recipientEmail: string,
      subject: string,
      body: string
    ) => {
      mailSendLog.push({
        userId,
        submissionDate,
        recipientEmail,
        mailType: subject.includes("確認メール") ? "confirmation" : "other",
        sentAt: new Date("2024-01-15T08:30:00Z").toISOString(),
      });
      return Promise.resolve({ success: true });
    };

    const result = await validateAndSubmitDailyReport(
      {
        userId,
        submissionDate,
        yesterdayAccomplishment,
        todayPlan,
        challengesFaced,
      },
      mockMailSender
    );

    expect(result.isValid).toBe(true);
    expect(result.message).toMatch(/送信完了/);
    expect(mailSendLog.length).toBe(2);
    expect(mailSendLog[0].recipientEmail).toMatch(/@/);
    expect(mailSendLog[0].mailType).toBe("confirmation");
    expect(mailSendLog[1].mailType).toBe("confirmation");
  });
});