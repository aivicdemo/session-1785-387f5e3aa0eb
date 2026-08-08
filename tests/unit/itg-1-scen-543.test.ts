import { type Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/orchestrator";
import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";

import { runTx2Imp1Agent } from "../../src/agents/tx-2-imp-1/orchestrator";

const fetchMock = require("jest-fetch-mock");

describe("日報入力フォームの提供と送信機能 - 日報収集から報告漏れ特定までの自動判定と通知", () => {
  let mockAiClient: Tx2Imp1AiClient;
  let consoleErrorSpy: ReturnType<typeof jest.spyOn>;
  let consoleLogSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

    mockAiClient = {
      analyzeReportingStatus: jest.fn(async (input) => {
        return {
          unsubmittedMembers: input.submissionStatus
            .filter((s) => s.status === "unsubmitted")
            .map((s) => ({
              userId: s.userId,
              name: s.name,
              status: "unsubmitted" as const,
            })),
          delayedMembers: input.submissionStatus
            .filter((s) => s.status === "delayed")
            .map((s) => ({
              userId: s.userId,
              name: s.name,
              submittedAt: s.submittedAt,
              status: "delayed" as const,
            })),
          onTimeMembers: input.submissionStatus
            .filter((s) => s.status === "on_time")
            .map((s) => s.userId),
        };
      }),
      generateNotificationEmail: jest.fn(async (input) => {
        const unsubmittedNames = input.unsubmittedMembers
          .map((m) => m.name)
          .join(", ");
        return {
          subject: `日報提出漏れ通知: 未提出者 ${unsubmittedNames}`,
          body: `本日の朝会開始までに日報が未提出の部員がいます。\n\n未提出者: ${unsubmittedNames}\n\n遅延者: ${input.delayedMembers.map((m) => m.name).join(", ") || "なし"}\n\n提出期限: ${input.submissionDeadline}\n\nご確認ください。`,
          to: input.managerEmail,
          timestamp: new Date().toISOString(),
        };
      }),
      recordAuditLog: jest.fn(async (input) => {
        return {
          logId: `audit_${Date.now()}`,
          action: input.action,
          executedAt: new Date().toISOString(),
          result: input.result,
        };
      }),
    };
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  // SCEN-543
  test("should automatically determine unreported members at scheduled time and notify manager", async () => {
    const scheduled_check_time = new Date("2024-01-15T08:00:00Z");
    const submission_deadline = "2024-01-15T08:00:00Z";
    const manager_email = "manager@company.com";

    const all_members = [
      { userId: "emp_001", name: "部員A" },
      { userId: "emp_002", name: "部員B" },
      { userId: "emp_003", name: "部員C" },
      { userId: "emp_004", name: "部員D" },
      { userId: "emp_005", name: "部員E" },
      { userId: "emp_006", name: "部員F" },
      { userId: "emp_007", name: "部員G" },
      { userId: "emp_008", name: "部員H" },
      { userId: "emp_009", name: "部員I" },
      { userId: "emp_010", name: "部員J" },
    ];

    const submission_status = [
      { userId: "emp_001", name: "部員A", status: "on_time" as const },
      { userId: "emp_002", name: "部員B", status: "on_time" as const },
      { userId: "emp_003", name: "部員C", status: "on_time" as const },
      { userId: "emp_004", name: "部員D", status: "on_time" as const },
      { userId: "emp_005", name: "部員E", status: "on_time" as const },
      { userId: "emp_006", name: "部員F", status: "on_time" as const },
      { userId: "emp_007", name: "部員G", status: "on_time" as const },
      { userId: "emp_008", name: "部員H", status: "on_time" as const },
      { userId: "emp_009", name: "部員I", status: "on_time" as const },
      { userId: "emp_010", name: "部員J", status: "unsubmitted" as const },
    ];

    fetchMock.mockResponseOnce(
      JSON.stringify({
        members: all_members,
        status: "ok",
      }),
      { status: 200 }
    );

    fetchMock.mockResponseOnce(
      JSON.stringify({
        submissionStatus: submission_status,
        checkedAt: scheduled_check_time.toISOString(),
      }),
      { status: 200 }
    );

    fetchMock.mockResponseOnce(
      JSON.stringify({
        notificationId: "notif_001",
        sent: true,
        timestamp: scheduled_check_time.toISOString(),
      }),
      { status: 200 }
    );

    fetchMock.mockResponseOnce(
      JSON.stringify({
        auditLogId: "audit_001",
        recorded: true,
      }),
      { status: 200 }
    );

    const result = await runTx2Imp1Agent({
      aiClient: mockAiClient,
      scheduledCheckTime: scheduled_check_time,
      submissionDeadline: submission_deadline,
      managerEmail: manager_email,
      allMembersCount: 10,
    });

    expect(result).toBeDefined();
    expect(result.executedAt).toBeDefined();
    expect(result.status).toBe("completed");
    expect(result.unsubmittedCount).toBe(1);
    expect(result.delayedCount).toBe(0);
    expect(result.onTimeCount).toBe(9);
    expect(result.notificationSent).toBe(true);
    expect(result.auditLogRecorded).toBe(true);

    expect(mockAiClient.analyzeReportingStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        submissionStatus: submission_status,
        submissionDeadline: submission_deadline,
      })
    );

    expect(mockAiClient.generateNotificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        managerEmail: manager_email,
        submissionDeadline: submission_deadline,
        unsubmittedMembers: expect.arrayContaining([
          expect.objectContaining({
            userId: "emp_010",
            name: "部員J",
            status: "unsubmitted",
          }),
        ]),
      })
    );

    expect(mockAiClient.recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "check_reporting_status_at_scheduled_time",
      })
    );

    const generated_email = await mockAiClient.generateNotificationEmail({
      managerEmail: manager_email,
      submissionDeadline: submission_deadline,
      unsubmittedMembers: [
        { userId: "emp_010", name: "部員J", status: "unsubmitted" },
      ],
      delayedMembers: [],
    });

    expect(generated_email.subject).toMatch(/日報提出漏れ通知/);
    expect(generated_email.subject).toMatch(/部員J/);
    expect(generated_email.body).toMatch(/未提出者/);
    expect(generated_email.body).toMatch(/部員J/);
    expect(generated_email.to).toBe(manager_email);

    expect(result.allMembersProcessed).toBe(10);
  });
});