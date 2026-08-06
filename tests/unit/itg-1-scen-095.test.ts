import { validateReportSubmission } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-095: [error] 朝会報告送信検証機能 - 本日の予定が空文字列のとき送信を中止してエラーメッセージを表示する
  test("本今日予定が空文字列の場合、エラーメッセージを表示して送信を中止する", () => {
    const yesterday_result = "完了";
    const today_plan = "";
    const current_issues = "なし";

    expect(() =>
      validateReportSubmission({
        yesterday_result,
        today_plan,
        current_issues,
      })
    ).toThrow(/本日の予定/);
  });
});