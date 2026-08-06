import { sendConfirmationEmailNotification } from "../../src/logic/it-2";

describe("送信時の自動確認メール通知", () => {
  // SCEN-077
  test("朝会報告の送信日時が未定義のときエラーとなる", () => {
    const mockReportWithoutDateTime = {
      reportId: "report-001",
      userId: "user-001",
      departmentId: "dept-001",
      yesterday: "実施した業務の説明",
      today: "本日予定の説明",
      issues: "抱えている課題の説明",
      sendDateTime: undefined as unknown as Date,
      createdAt: new Date("2024-01-15T08:00:00Z"),
    };

    expect(() => sendConfirmationEmailNotification(mockReportWithoutDateTime)).toThrow(
      /sendDateTime is required/
    );
  });
});