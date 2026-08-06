import { validateAndSubmitDailyReport } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  test("SCEN-481: 昨日やったことが空文字列の場合にエラーになる", () => {
    // Arrange
    const yesterdayActivity = "";
    const todayPlan = "タスクA実施";
    const currentIssue = "issue-001対応中";
    const userId = "user-123";
    const submissionDate = new Date("2024-01-15T09:00:00Z");

    const input = {
      userId,
      submissionDate,
      yesterdayActivity,
      todayPlan,
      currentIssue,
    };

    // Act & Assert
    expect(() => validateAndSubmitDailyReport(input)).toThrow(/昨日やったこと/);
  });
});