import { validateAndSendReport } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-149: [error] 日報送信重複チェック機能 - 送信日時が不正な形式のとき送信を拒否する
  test("should reject submission when sent_at has invalid format", () => {
    const report = {
      user_id: "user_001",
      yesterday_achievement: "テスト実施",
      today_plan: "バグ修正",
      current_issue: "納期調整",
      sent_at: "2024/13/45 25:99:99",
    };

    expect(() => validateAndSendReport(report)).toThrow(/送信日時/);
  });
});