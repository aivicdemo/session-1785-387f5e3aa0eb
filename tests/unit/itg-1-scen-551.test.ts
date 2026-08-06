import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx2Imp1Agent } from "../../src/agents/tx-2-imp-1/orchestrator";
import type { Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/types";
import type { AuditLog } from "../../src/types/audit";

describe("AI Agent tx-2-imp-1: 日報収集から報告漏れ特定までの自動判定と通知", () => {
  let audit_logs: AuditLog[];
  let fake_ai_client: Tx2Imp1AiClient;

  beforeEach(() => {
    audit_logs = [];
    fake_ai_client = {
      callModel: async (prompt: string) => {
        return {
          content: "",
          usage: { input_tokens: 0, output_tokens: 0 },
        };
      },
      fetchReportsByDepartment: async (dept_id: string) => {
        audit_logs.push({
          timestamp: new Date("2024-01-15T10:00:00Z").toISOString(),
          operator_role: "member",
          operation_name: "fetch_other_department_reports",
          target_department_id: dept_id,
          result: "DENIED",
          reason: "User role 'member' cannot access other department reports",
        });
        throw {
          status: 403,
          code: "AUTHORIZATION_DENIED",
          message: "Access to other department data denied",
        };
      },
      sendManagerNotification: async (
        manager_id: string,
        notification_data: unknown
      ) => {
        audit_logs.push({
          timestamp: new Date("2024-01-15T10:00:30Z").toISOString(),
          operator_role: "member",
          operation_name: "send_manager_notification",
          target_manager_id: manager_id,
          result: "DENIED",
          reason: "User role 'member' cannot send manager notifications",
        });
        throw {
          status: 403,
          code: "AUTHORIZATION_DENIED",
          message: "Cannot send manager notifications",
        };
      },
      updateSystemSettings: async (settings: unknown) => {
        audit_logs.push({
          timestamp: new Date("2024-01-15T10:01:00Z").toISOString(),
          operator_role: "member",
          operation_name: "update_system_settings",
          result: "DENIED",
          reason: "User role 'member' cannot update system settings",
        });
        throw {
          status: 403,
          code: "AUTHORIZATION_DENIED",
          message: "Cannot update system settings",
        };
      },
      createReportList: async (reports: unknown) => {
        return { list_id: "list_001", report_count: 0 };
      },
    };
  });

  afterEach(() => {
    audit_logs = [];
  });

  // SCEN-551
  test("should deny authorization for member role accessing other department reports, sending manager notifications, and updating system settings", async () => {
    const user_context = {
      user_id: "user_member_001",
      role: "member",
      department_id: "dev_dept",
      assigned_at: new Date("2024-01-15T09:00:00Z").toISOString(),
    };

    const check_time = new Date("2024-01-15T10:00:00Z");
    const report_deadline = new Date("2024-01-15T09:30:00Z");

    const result = await runTx2Imp1Agent(
      {
        user_context,
        check_time,
        report_deadline,
        ai_client: fake_ai_client,
      },
      async (log: AuditLog) => {
        audit_logs.push(log);
      }
    );

    expect(result.status).toBe("AUTHORIZATION_DENIED");
    expect(result.denied_operations).toContain("fetch_other_department_reports");
    expect(result.denied_operations).toContain("send_manager_notification");
    expect(result.denied_operations).toContain("update_system_settings");
    expect(result.denied_operations.length).toBeGreaterThanOrEqual(3);

    expect(result.error_message).toBeDefined();
    expect(result.error_message).toMatch(/Authorization/);

    const authorization_denied_logs = audit_logs.filter(
      (log: AuditLog) => log.result === "DENIED"
    );
    expect(authorization_denied_logs.length).toBeGreaterThanOrEqual(3);

    const fetch_logs = audit_logs.filter(
      (log: AuditLog) =>
        log.operation_name === "fetch_other_department_reports" &&
        log.result === "DENIED"
    );
    expect(fetch_logs.length).toBeGreaterThanOrEqual(1);
    expect(fetch_logs[0].operator_role).toBe("member");
    expect(fetch_logs[0].reason).toMatch(/member.*cannot access/i);

    const notification_logs = audit_logs.filter(
      (log: AuditLog) =>
        log.operation_name === "send_manager_notification" &&
        log.result === "DENIED"
    );
    expect(notification_logs.length).toBeGreaterThanOrEqual(1);
    expect(notification_logs[0].operator_role).toBe("member");
    expect(notification_logs[0].reason).toMatch(/member.*cannot send/i);

    const settings_logs = audit_logs.filter(
      (log: AuditLog) =>
        log.operation_name === "update_system_settings" &&
        log.result === "DENIED"
    );
    expect(settings_logs.length).toBeGreaterThanOrEqual(1);
    expect(settings_logs[0].operator_role).toBe("member");
    expect(settings_logs[0].reason).toMatch(/member.*cannot update/i);

    const all_logs = audit_logs.filter(
      (log: AuditLog) => log.result === "DENIED"
    );
    all_logs.forEach((log: AuditLog) => {
      expect(log.timestamp).toBeDefined();
      expect(log.operator_role).toBe("member");
      expect(log.reason).toBeDefined();
      expect(log.reason.length).toBeGreaterThan(0);
    });

    expect(result.manager_notifications_sent).toBe(0);
    expect(result.reports_fetched).toBe(0);
    expect(result.system_settings_updated).toBe(false);
  });
});