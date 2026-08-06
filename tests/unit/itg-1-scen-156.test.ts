import { submitDailyReport } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-156: [edge] 日報送信重複チェック機能 - 同一ユーザーが異なる日付で送信した場合は重複チェックをスキップして送信を許可する
  test("同一ユーザーが異なる日付で送信した場合、重複チェックをスキップして送信を許可する", async () => {
    const user_id_a = "user-A";
    const yesterday_accomplished_1 = "タスクA完了";
    const today_plan_1 = "タスクB開始";
    const issue_1 = "課題1";
    const send_date_1 = "2024-01-15";

    const yesterday_accomplished_2 = "タスクB進行中";
    const today_plan_2 = "タスクC開始";
    const issue_2 = "課題2";
    const send_date_2 = "2024-01-16";

    // 初回送信: 2024年1月15日の日報
    const first_submission_result = await submitDailyReport({
      user_id: user_id_a,
      send_date: send_date_1,
      yesterday_accomplished: yesterday_accomplished_1,
      today_plan: today_plan_1,
      issue: issue_1,
    });

    expect(first_submission_result.status).toBe("success");
    expect(first_submission_result.send_date).toBe(send_date_1);
    expect(first_submission_result.user_id).toBe(user_id_a);
    expect(first_submission_result.message).toMatch(/送信完了/);
    expect(first_submission_result.db_saved).toBe(true);

    // 2回目送信: 同じユーザーAが2024年1月16日の日報を送信
    const second_submission_result = await submitDailyReport({
      user_id: user_id_a,
      send_date: send_date_2,
      yesterday_accomplished: yesterday_accomplished_2,
      today_plan: today_plan_2,
      issue: issue_2,
    });

    // 異なる日付のため重複判定されず、送信が許可される
    expect(second_submission_result.status).toBe("success");
    expect(second_submission_result.send_date).toBe(send_date_2);
    expect(second_submission_result.user_id).toBe(user_id_a);
    expect(second_submission_result.message).toMatch(/送信完了/);
    expect(second_submission_result.db_saved).toBe(true);

    // 管理者宛確認メールに送信内容が含まれていることを確認
    expect(second_submission_result.confirmation_email_body).toContain(
      yesterday_accomplished_2
    );
    expect(second_submission_result.confirmation_email_body).toContain(
      today_plan_2
    );
    expect(second_submission_result.confirmation_email_body).toContain(
      issue_2
    );

    // 2つの送信記録が別々に保存されていることを確認
    expect(first_submission_result.record_id).not.toBe(
      second_submission_result.record_id
    );
  });
});