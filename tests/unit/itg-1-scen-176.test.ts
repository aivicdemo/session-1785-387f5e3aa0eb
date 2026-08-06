import { validateReportSubmission } from "../../src/logic/it-1";

describe("朝会報告入力フォームの提供と送信機能", () => {
  // SCEN-176
  test("第3項目の形式が要求形式に不適合のとき送信を中断してエラーメッセージを表示する", () => {
    const report_input = {
      yesterday_achievement: "完了した業務内容",
      today_plan: "予定された業務内容",
      current_challenge: "課題@#$%",
    };

    expect(() => validateReportSubmission(report_input)).toThrow(/形式/);
  });
});