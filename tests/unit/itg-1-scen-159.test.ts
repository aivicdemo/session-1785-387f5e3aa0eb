import { submitDailyReport } from "../../src/logic/it-1";

describe("日報送信重複チェック機能", () => {
  test("SCEN-159: 複数ユーザーが同一日付に送信した場合、各ユーザーの送信履歴は独立して管理される", () => {
    const submission_date = "2024-01-15";
    const user_a_id = "user-a-001";
    const user_b_id = "user-b-002";

    const user_a_yesterday = "タスクA完了";
    const user_a_today = "タスクB開始";
    const user_a_issue = "課題なし";

    const user_b_yesterday = "レビュー実施";
    const user_b_today = "テスト開始";
    const user_b_issue = "環境構築中";

    const user_a_report = {
      user_id: user_a_id,
      submission_date: submission_date,
      yesterday_achievement: user_a_yesterday,
      today_plan: user_a_today,
      current_issue: user_a_issue,
    };

    const user_b_report = {
      user_id: user_b_id,
      submission_date: submission_date,
      yesterday_achievement: user_b_yesterday,
      today_plan: user_b_today,
      current_issue: user_b_issue,
    };

    const user_a_result = submitDailyReport(user_a_report);
    const user_b_result = submitDailyReport(user_b_report);

    expect(user_a_result.success).toBe(true);
    expect(user_a_result.user_id).toBe(user_a_id);
    expect(user_a_result.submission_date).toBe(submission_date);
    expect(user_a_result.yesterday_achievement).toBe(user_a_yesterday);
    expect(user_a_result.today_plan).toBe(user_a_today);
    expect(user_a_result.current_issue).toBe(user_a_issue);
    expect(user_a_result.submission_id).toBeDefined();

    expect(user_b_result.success).toBe(true);
    expect(user_b_result.user_id).toBe(user_b_id);
    expect(user_b_result.submission_date).toBe(submission_date);
    expect(user_b_result.yesterday_achievement).toBe(user_b_yesterday);
    expect(user_b_result.today_plan).toBe(user_b_today);
    expect(user_b_result.current_issue).toBe(user_b_issue);
    expect(user_b_result.submission_id).toBeDefined();

    expect(user_a_result.submission_id).not.toBe(user_b_result.submission_id);

    const user_a_history = user_a_result.submission_history;
    const user_b_history = user_b_result.submission_history;

    expect(user_a_history).toHaveLength(1);
    expect(user_a_history[0].user_id).toBe(user_a_id);
    expect(user_a_history[0].submission_date).toBe(submission_date);
    expect(user_a_history[0].yesterday_achievement).toBe(user_a_yesterday);

    expect(user_b_history).toHaveLength(1);
    expect(user_b_history[0].user_id).toBe(user_b_id);
    expect(user_b_history[0].submission_date).toBe(submission_date);
    expect(user_b_history[0].yesterday_achievement).toBe(user_b_yesterday);

    expect(user_a_history[0].user_id).not.toBe(user_b_history[0].user_id);
    expect(user_a_history[0].yesterday_achievement).not.toBe(
      user_b_history[0].yesterday_achievement
    );
  });
});