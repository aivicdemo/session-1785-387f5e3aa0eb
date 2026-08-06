import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx4Imp1Agent } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-582
  test("権限外ユーザーの日報収集から課題抽出までの自動実行が認可チェック層で拒否される", async () => {
    const unauthorized_user_id = "user_unauthorized_001";
    const unauthorized_token = "token_insufficient_permission_xyz";
    const manager_user_id = "manager_001";
    const team_department_id = "dept_dev_001";
    const audit_timestamp = "2024-01-15T08:30:00Z";

    const unauthorized_context = {
      user_id: unauthorized_user_id,
      token: unauthorized_token,
      permissions: ["report_view"],
      roles: ["engineer"],
      department_id: team_department_id,
      request_timestamp: audit_timestamp,
    };

    const mock_audit_log_calls: Array<{
      user_id: string;
      action: string;
      result: string;
      timestamp: string;
      reason?: string;
    }> = [];

    const mock_email_send_calls: Array<{
      to: string;
      subject: string;
      body: string;
    }> = [];

    const mock_ai_client = {
      call_fetch_reports: jest.fn().mockRejectedValue(
        new Error(
          "AUTHORIZATION_DENIED: User lacks permission to fetch reports"
        )
      ),
      call_send_email: jest.fn().mockImplementation(() => {
        mock_email_send_calls.push({
          to: manager_user_id,
          subject: "Report Summary",
          body: "test",
        });
        return Promise.resolve();
      }),
      call_extract_issues: jest.fn(),
      call_judge_priority: jest.fn(),
      call_audit_log: jest.fn().mockImplementation((entry) => {
        mock_audit_log_calls.push(entry);
        return Promise.resolve();
      }),
    };

    const authorization_error = await runTx4Imp1Agent(
      {
        user_context: unauthorized_context,
        target_department_id: team_department_id,
        ai_client: mock_ai_client,
        record_audit_log: (entry) => {
          mock_audit_log_calls.push(entry);
        },
      } as any
    ).catch((error) => error);

    expect(authorization_error).toBeDefined();
    expect(authorization_error.message).toMatch(/AUTHORIZATION_DENIED/);
    expect(authorization_error.message).toMatch(/権限/);

    expect(mock_ai_client.call_fetch_reports).toHaveBeenCalled();

    expect(mock_email_send_calls).toHaveLength(0);
    expect(mock_ai_client.call_extract_issues).not.toHaveBeenCalled();
    expect(mock_ai_client.call_judge_priority).not.toHaveBeenCalled();

    const authorization_denied_logs = mock_audit_log_calls.filter(
      (log) =>
        log.user_id === unauthorized_user_id &&
        log.action === "Tx4Imp1Agent_execution_attempt" &&
        log.result === "AUTHORIZATION_DENIED"
    );

    expect(authorization_denied_logs.length).toBeGreaterThanOrEqual(1);

    const audit_entry = authorization_denied_logs[0];
    expect(audit_entry).toBeDefined();
    expect(audit_entry.user_id).toBe(unauthorized_user_id);
    expect(audit_entry.action).toBe("Tx4Imp1Agent_execution_attempt");
    expect(audit_entry.result).toBe("AUTHORIZATION_DENIED");
    expect(audit_entry.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/);
    expect(audit_entry.reason).toMatch(/権限がありません|Forbidden|AUTHORIZATION_DENIED/);
  });
});