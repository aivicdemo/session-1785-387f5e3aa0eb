import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import fetchMock from "jest-fetch-mock";
import { submitDailyReport } from "../../src/logic/it-1";

fetchMock.enableMocks();

describe("Daily Report Input Form and Submission", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-117
  test("should record confirmation email to sender in mail send log on report submission", async () => {
    const user_id = "USR-ENG-001";
    const user_email = "engineer@example.com";
    const department_id = "DEPT-DEV-001";
    const yesterday_achievement = "設計書レビュー完了";
    const today_plan = "実装開始";
    const issue_held = "テスト環境の構築遅延";
    const submit_timestamp_iso = "2024-01-15T08:30:00Z";
    const submit_timestamp = new Date(submit_timestamp_iso);

    const expected_email_type = "確認メール";
    const expected_send_status = "成功";

    fetchMock.mockResponseOnce(
      JSON.stringify({
        mail_send_log_id: "LOG-20240115-001",
        sender_user_id: user_id,
        recipient_email: user_email,
        email_type: expected_email_type,
        send_status: expected_send_status,
        sent_at: submit_timestamp_iso,
        mail_subject: "朝会報告送信完了のお知らせ",
        mail_body: `昨日の実績: ${yesterday_achievement}\n本日の予定: ${today_plan}\n抱えている課題: ${issue_held}`,
      }),
      { status: 200 }
    );

    const report_input = {
      user_id: user_id,
      user_email: user_email,
      department_id: department_id,
      yesterday_achievement: yesterday_achievement,
      today_plan: today_plan,
      issue_held: issue_held,
      submit_timestamp: submit_timestamp,
    };

    const result = await submitDailyReport(report_input);

    expect(result).toBeDefined();
    expect(result.mail_send_log_id).toBe("LOG-20240115-001");
    expect(result.sender_user_id).toBe(user_id);
    expect(result.recipient_email).toBe(user_email);
    expect(result.email_type).toBe(expected_email_type);
    expect(result.send_status).toBe(expected_send_status);
    expect(result.sent_at).toBe(submit_timestamp_iso);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0];
    expect(call[0]).toMatch(/mail-send-log|confirm-email/);
    expect(call[1]?.method).toBe("POST");
  });
});