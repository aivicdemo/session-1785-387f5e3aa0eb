import { validateAndSubmitReport } from "../../src/logic/it-1";

describe("朝会報告送信フォームの検証", () => {
  test("SCEN-104: 昨日の実績のみ空欄でエラーメッセージを表示", () => {
    const formInput = {
      yesterdayAccomplishment: "",
      todayPlan: "顧客Aへの提案資料作成",
      currentIssue: "プロジェクト予算の承認待ち",
    };

    const result = validateAndSubmitReport(formInput);

    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toMatch(/昨日やったこと/);
    expect(result.errorMessage).toMatch(/必須項目/);
    expect(result.mailSent).toBe(false);
    expect(result.retainedTodayPlan).toBe("顧客Aへの提案資料作成");
    expect(result.retainedCurrentIssue).toBe("プロジェクト予算の承認待ち");
  });
});