import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { submitDailyReport } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-141
  test("確認メール自動配信機能 - 日報送信が月初日の場合、メール送信ログに正しく記録される", () => {
    const mock_send_email = jest.fn<(...args: any[]) => any>().mockResolvedValue({
      success: true,
      message_id: "msg_20240101_001",
    });

    const mock_log_email_send = jest.fn<(...args: any[]) => any>().mockResolvedValue({
      id: "log_001",
      sent_at: "2024-01-01T09:00:00Z",
      status: "success",
    });

    const mock_get_admin_email = jest
      .fn()
      .mockReturnValue("admin@example.com");

    const input_yesterday_achievement = "前日業務完了";
    const input_today_plan = "本日予定";
    const input_current_issues = "課題A";
    const submit_timestamp = new Date("2024-01-01T09:00:00Z");
    const user_id = "user_engineer_001";
    const department_id = "dept_dev_001";

    const result = submitDailyReport({
      user_id: user_id,
      department_id: department_id,
      yesterday_achievement: input_yesterday_achievement,
      today_plan: input_today_plan,
      current_issues: input_current_issues,
      submitted_at: submit_timestamp,
      send_email_fn: mock_send_email,
      log_email_send_fn: mock_log_email_send,
      get_admin_email_fn: mock_get_admin_email,
    });

    expect(result.success).toBe(true);
    expect(result.report_id).toBeDefined();

    expect(mock_get_admin_email).toHaveBeenCalledWith(department_id);

    expect(mock_send_email).toHaveBeenCalledWith({
      to: "admin@example.com",
      subject: expect.stringContaining("朝会報告確認メール"),
      body: expect.stringContaining("昨日やったこと：前日業務完了"),
    });

    expect(mock_send_email).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining("今日やること：本日予定"),
      })
    );

    expect(mock_send_email).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining("抱えている課題：課題A"),
      })
    );

    expect(mock_log_email_send).toHaveBeenCalledWith({
      sent_at: "2024-01-01T09:00:00Z",
      status: "success",
      recipient: "admin@example.com",
      subject: expect.stringContaining("朝会報告確認メール"),
      body: expect.stringContaining("昨日やったこと：前日業務完了"),
    });

    const log_call_args = mock_log_email_send.mock.calls[0][0];
    expect(log_call_args.sent_at).toBe("2024-01-01T09:00:00Z");
    expect(log_call_args.status).toBe("success");
    expect(log_call_args.recipient).toBe("admin@example.com");
    expect(log_call_args.subject).toMatch(/朝会報告確認メール/);
    expect(log_call_args.body).toMatch(/昨日やったこと：前日業務完了/);
    expect(log_call_args.body).toMatch(/今日やること：本日予定/);
    expect(log_call_args.body).toMatch(/抱えている課題：課題A/);
  });
});