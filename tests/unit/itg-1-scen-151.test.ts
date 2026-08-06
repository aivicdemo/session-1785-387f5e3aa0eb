import { submitReport } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-151
  test("同一ユーザーが同一日付で3回目以降の送信を試みたとき送信を拒否する", () => {
    const user_id = "user_a";
    const report_date = "2024-01-15";
    const yesterday_achievement_1 = "昨日の成果1";
    const today_plan_1 = "今日の予定1";
    const issue_1 = "課題1";
    const yesterday_achievement_2 = "昨日の成果2";
    const today_plan_2 = "今日の予定2";
    const issue_2 = "課題2";
    const yesterday_achievement_3 = "昨日の成果3";
    const today_plan_3 = "今日の予定3";
    const issue_3 = "課題3";
    const mock_send_confirmation_email = jest.fn();

    // 1回目の送信
    const result_first = submitReport(
      {
        user_id: user_id,
        report_date: report_date,
        yesterday_achievement: yesterday_achievement_1,
        today_plan: today_plan_1,
        issue: issue_1,
      },
      mock_send_confirmation_email
    );

    expect(result_first.success).toBe(true);
    expect(result_first.error_message).toBeUndefined();
    expect(mock_send_confirmation_email).toHaveBeenCalledTimes(1);
    expect(mock_send_confirmation_email).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: user_id,
        report_date: report_date,
      })
    );

    // 2回目の送信
    const result_second = submitReport(
      {
        user_id: user_id,
        report_date: report_date,
        yesterday_achievement: yesterday_achievement_2,
        today_plan: today_plan_2,
        issue: issue_2,
      },
      mock_send_confirmation_email
    );

    expect(result_second.success).toBe(true);
    expect(result_second.error_message).toBeUndefined();
    expect(mock_send_confirmation_email).toHaveBeenCalledTimes(2);

    // 3回目の送信
    const result_third = submitReport(
      {
        user_id: user_id,
        report_date: report_date,
        yesterday_achievement: yesterday_achievement_3,
        today_plan: today_plan_3,
        issue: issue_3,
      },
      mock_send_confirmation_email
    );

    expect(result_third.success).toBe(false);
    expect(result_third.error_message).toMatch(/本日はすでに日報を送信済み/);
    expect(result_third.button_disabled).toBe(true);
    expect(mock_send_confirmation_email).toHaveBeenCalledTimes(2);
  });
});