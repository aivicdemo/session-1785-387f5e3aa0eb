import { validateAndSubmitDailyReport } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-171
  test("第1項目が禁止文字を含むとき送信を中断してエラーメッセージを表示する", () => {
    const yesterday_with_malicious_script = "<script>alert('test')</script>";
    const today = "会議参加";
    const challenges = "資料作成";

    const input_report = {
      yesterday: yesterday_with_malicious_script,
      today: today,
      challenges: challenges,
    };

    expect(() => validateAndSubmitDailyReport(input_report)).toThrow(
      /第1項目に使用できない文字/
    );
  });
});