import { sendReportWithEmailNotification } from "../../src/logic/it-1-br-1-1-1";

describe("報告送信時の確認メール自動配信機能", () => {
  // SCEN-472
  test("同一ユーザーから複数回送信された報告が混在する場合、最新の送信状態のみを考慮される", () => {
    const user_id_a = "user-001";
    const report_date = "2024-01-15";
    const manager_email = "manager@example.com";
    const user_a_email = "engineer-a@example.com";

    const first_report_content = {
      yesterday_achievement: "タスクA完了",
      today_plan: "タスクB開始",
      challenge: "なし",
    };

    const second_report_content = {
      yesterday_achievement: "タスクA完了",
      today_plan: "タスクC開始",
      challenge: "予算承認待ち",
    };

    const first_send_result = sendReportWithEmailNotification({
      user_id: user_id_a,
      report_date: report_date,
      yesterday_achievement: first_report_content.yesterday_achievement,
      today_plan: first_report_content.today_plan,
      challenge: first_report_content.challenge,
      user_email: user_a_email,
      manager_email: manager_email,
    });

    expect(first_send_result.status).toBe("sent");
    expect(first_send_result.report_id).toBeTruthy();
    expect(first_send_result.email_notifications_sent).toBe(2);
    expect(first_send_result.recipients).toContain(user_a_email);
    expect(first_send_result.recipients).toContain(manager_email);

    const first_status = first_send_result.report_status;
    expect(first_status.user_id).toBe(user_id_a);
    expect(first_status.is_submitted).toBe(true);
    expect(first_status.submission_count).toBe(1);
    expect(first_status.latest_content.yesterday_achievement).toBe(
      "タスクA完了"
    );
    expect(first_status.latest_content.today_plan).toBe("タスクB開始");
    expect(first_status.latest_content.challenge).toBe("なし");

    const second_send_result = sendReportWithEmailNotification({
      user_id: user_id_a,
      report_date: report_date,
      yesterday_achievement: second_report_content.yesterday_achievement,
      today_plan: second_report_content.today_plan,
      challenge: second_report_content.challenge,
      user_email: user_a_email,
      manager_email: manager_email,
    });

    expect(second_send_result.status).toBe("sent");
    expect(second_send_result.report_id).toBeTruthy();
    expect(second_send_result.email_notifications_sent).toBe(2);
    expect(second_send_result.recipients).toContain(user_a_email);
    expect(second_send_result.recipients).toContain(manager_email);

    const second_status = second_send_result.report_status;
    expect(second_status.user_id).toBe(user_id_a);
    expect(second_status.is_submitted).toBe(true);
    expect(second_status.submission_count).toBe(2);
    expect(second_status.latest_content.yesterday_achievement).toBe(
      "タスクA完了"
    );
    expect(second_status.latest_content.today_plan).toBe("タスクC開始");
    expect(second_status.latest_content.challenge).toBe("予算承認待ち");

    expect(second_status.first_submission_time).toBeDefined();
    expect(second_status.latest_submission_time).toBeDefined();
    expect(
      new Date(second_status.latest_submission_time).getTime() >
        new Date(second_status.first_submission_time).getTime()
    ).toBe(true);
  });
});