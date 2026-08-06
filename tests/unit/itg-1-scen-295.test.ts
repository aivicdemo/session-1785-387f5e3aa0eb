import { sendConfirmationEmailsForReport } from "../../src/logic/it-1-br-1-1-1";

describe("確認メール配信機能 - バリデーション", () => {
  // SCEN-295
  test("報告内容2項目目が空文字のとき、メール配信処理が中断される", () => {
    const incompleteReportData = {
      reporterId: "user-001",
      reporterName: "田中太郎",
      yesterdayAccomplishment: "完了",
      todayPlan: "",
      currentIssues: "なし",
      departmentHeadEmail: "manager@example.com",
      reporterEmail: "tanaka@example.com",
      submittedAt: new Date("2024-01-15T09:00:00Z"),
    };

    expect(() => {
      sendConfirmationEmailsForReport(incompleteReportData);
    }).toThrow(/報告内容/);
  });
});