import { determineReportSubmissionStatus } from "../../src/logic/it-1";

describe("朝会報告送信状況判定機能", () => {
  // SCEN-199
  test("同じ入力で2回実行しても同じ判定結果が返される", () => {
    const user_id = "user001";
    const report_date = "2024-01-15";
    const yesterday_achievement = "A機能のテスト完了";
    const today_plan = "B機能の実装";
    const current_issue = "C機能の仕様不明";

    const first_input = {
      user_id,
      report_date,
      yesterday_achievement,
      today_plan,
      current_issue,
    };

    const first_result = determineReportSubmissionStatus(first_input);

    const second_input = {
      user_id,
      report_date,
      yesterday_achievement,
      today_plan,
      current_issue,
    };

    const second_result = determineReportSubmissionStatus(second_input);

    expect(first_result.status).toBe(second_result.status);
    expect(first_result.message).toBe(second_result.message);
    expect(first_result.supplementary_info).toBe(
      second_result.supplementary_info
    );
  });
});