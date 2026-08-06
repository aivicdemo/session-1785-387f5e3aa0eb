import { validateAndSubmitReport } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-097
  test("抱えている課題が空文字列のとき送信を中止してエラーメッセージを表示する", () => {
    const yesterday_achievement = "昨日は顧客Aのバグ修正を完了しました";
    const today_plan = "今日はテスト環境への展開を予定しています";
    const issues = "";

    expect(() =>
      validateAndSubmitReport({
        yesterday_achievement,
        today_plan,
        issues,
      })
    ).toThrow(/抱えている課題は必須項目です/);
  });
});