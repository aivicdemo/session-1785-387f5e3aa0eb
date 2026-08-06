import { validateReportSubmission } from "../../src/logic/it-1";

describe("朝会報告送信検証機能", () => {
  // SCEN-093
  test("昨日の実績が空文字列のとき送信を中止してエラーメッセージを表示する", () => {
    const yesterday_accomplishment = "";
    const today_plan = "タスクA実施";
    const current_issues = "課題B対応";

    const result = validateReportSubmission({
      yesterday_accomplishment,
      today_plan,
      current_issues,
    });

    expect(result.is_valid).toBe(false);
    expect(result.error_message).toMatch(/昨日やったこと/);
    expect(result.error_message).toMatch(/必須/);
    expect(result.should_send_confirmation_email).toBe(false);
  });
});