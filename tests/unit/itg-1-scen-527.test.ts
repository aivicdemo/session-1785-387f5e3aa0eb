import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { runTx1Imp1Agent } from "../../src/agents/tx-1-imp-1/orchestrator";
import type { Tx1Imp1AiClient } from "../../src/agents/tx-1-imp-1/ai-client";

interface TemplateDistributionResult {
  success: boolean;
  mailsSent: number;
  distributionHistoryId: string;
  distributionStatus: string;
  auditEvents: AuditEvent[];
}

interface AuditEvent {
  action: string;
  timestamp: string;
  status: string;
}

interface MockUser {
  userId: string;
  email: string;
  role: string;
}

interface MockMailLog {
  messageId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  sentAt: string;
}

interface MockDistributionHistory {
  historyId: string;
  action: string;
  status: string;
  mailsCount: number;
  timestamp: string;
}

describe("日報入力フォーム提供と送信機能 - AIエージェント自動化", () => {
  let mockUsers: MockUser[];
  let mockMailLogs: MockMailLog[];
  let mockDistributionHistory: MockDistributionHistory[];
  let mockAuditEvents: AuditEvent[];
  let mockAiClient: Tx1Imp1AiClient;
  let systemExecutionTime: Date;

  beforeEach(() => {
    // Initialize mock data structures
    mockUsers = [
      { userId: "ENG001", email: "engineer1@company.com", role: "engineer" },
      { userId: "ENG002", email: "engineer2@company.com", role: "engineer" },
      { userId: "ENG003", email: "engineer3@company.com", role: "engineer" },
      { userId: "ENG004", email: "engineer4@company.com", role: "engineer" },
      { userId: "ENG005", email: "engineer5@company.com", role: "engineer" },
      { userId: "ENG006", email: "engineer6@company.com", role: "engineer" },
      { userId: "ENG007", email: "engineer7@company.com", role: "engineer" },
      { userId: "ENG008", email: "engineer8@company.com", role: "engineer" },
      { userId: "ENG009", email: "engineer9@company.com", role: "engineer" },
      { userId: "ENG010", email: "engineer10@company.com", role: "engineer" },
    ];

    mockMailLogs = [];
    mockDistributionHistory = [];
    mockAuditEvents = [];

    // Set execution time to previous day 17:00
    systemExecutionTime = new Date("2024-01-14T17:00:00Z");

    // Create mock AI client stub
    mockAiClient = {
      sendTemplateDistributionMail: jest
        .fn()
        .mockImplementation(
          async (recipients: string[], subject: string, body: string) => {
            recipients.forEach((email: string) => {
              mockMailLogs.push({
                messageId: `MSG-${Date.now()}-${Math.random()}`,
                recipientEmail: email,
                subject: subject,
                body: body,
                sentAt: systemExecutionTime.toISOString(),
              });
            });
            return { success: true, count: recipients.length };
          }
        ),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-527
  test("should autonomously generate and distribute daily report template to all 10 engineers at scheduled time with audit logging", async () => {
    // Arrange: Set system state and inject AI client
    const triggerTime = new Date("2024-01-14T17:00:00Z");
    const expectedMailCount = 10;
    const expectedTemplateFields = [
      "昨日やったこと",
      "今日やること",
      "抱えている課題",
    ];

    // Act: Trigger autonomous action via agent
    const result: TemplateDistributionResult = await runTx1Imp1Agent(
      mockUsers,
      triggerTime,
      mockAiClient,
      mockDistributionHistory,
      mockAuditEvents
    );

    // Assert 1: Verify AI client was invoked
    expect(mockAiClient.sendTemplateDistributionMail).toHaveBeenCalled();

    // Assert 2: Verify mail count equals engineer count (10)
    expect(mockMailLogs.length).toBe(expectedMailCount);

    // Assert 3: Verify each engineer receives exactly one mail (idempotency)
    const recipientSet = new Set(mockMailLogs.map((log) => log.recipientEmail));
    expect(recipientSet.size).toBe(expectedMailCount);

    // Assert 4: Verify all registered engineer emails are recipients
    mockUsers.forEach((user) => {
      const recipientExists = mockMailLogs.some(
        (log) => log.recipientEmail === user.email
      );
      expect(recipientExists).toBe(true);
    });

    // Assert 5: Verify mail subject contains "日報テンプレート"
    mockMailLogs.forEach((log) => {
      expect(log.subject).toMatch(/日報テンプレート/);
    });

    // Assert 6: Verify mail body contains all three required fields
    mockMailLogs.forEach((log) => {
      expectedTemplateFields.forEach((field) => {
        expect(log.body).toMatch(new RegExp(field));
      });
    });

    // Assert 7: Verify mail body contains form URL or access method
    mockMailLogs.forEach((log) => {
      expect(log.body).toMatch(
        /https?:\/\/|アクセス方法|フォーム|入力画面/
      );
    });

    // Assert 8: Verify no duplicate messages in mail logs
    const messageIdSet = new Set(mockMailLogs.map((log) => log.messageId));
    expect(messageIdSet.size).toBe(mockMailLogs.length);

    // Assert 9: Verify distribution history record created
    expect(mockDistributionHistory.length).toBe(1);
    const historyRecord = mockDistributionHistory[0];
    expect(historyRecord.historyId).toBeDefined();
    expect(historyRecord.action).toBe("template_distribution");

    // Assert 10: Verify history record mailsCount equals 10
    expect(historyRecord.mailsCount).toBe(10);

    // Assert 11: Verify history record timestamp matches execution time
    expect(new Date(historyRecord.timestamp).toISOString()).toBe(
      triggerTime.toISOString()
    );

    // Assert 12: Verify distribution history status is '配信完了'
    expect(historyRecord.status).toBe("配信完了");

    // Assert 13: Verify audit log contains distribution start event
    const startEvent = mockAuditEvents.find(
      (event) =>
        event.action === "自律アクション: テンプレート配信開始" &&
        event.status === "in_progress"
    );
    expect(startEvent).toBeDefined();
    expect(new Date(startEvent!.timestamp).toISOString()).toBeDefined();

    // Assert 14: Verify audit log contains distribution completion event
    const completionEvent = mockAuditEvents.find(
      (event) =>
        event.action === "自律アクション: テンプレート配信完了" &&
        event.status === "completed"
    );
    expect(completionEvent).toBeDefined();
    expect(new Date(completionEvent!.timestamp).toISOString()).toBeDefined();

    // Assert 15: Verify audit events are in chronological order
    if (startEvent && completionEvent) {
      expect(
        new Date(startEvent.timestamp).getTime() <=
          new Date(completionEvent.timestamp).getTime()
      ).toBe(true);
    }

    // Assert 16: Verify agent result success flag
    expect(result.success).toBe(true);

    // Assert 17: Verify result mailsSent count equals 10
    expect(result.mailsSent).toBe(10);

    // Assert 18: Verify distribution history ID is present in result
    expect(result.distributionHistoryId).toBeDefined();
    expect(result.distributionHistoryId).toBe(historyRecord.historyId);

    // Assert 19: Verify result status is '配信完了'
    expect(result.distributionStatus).toBe("配信完了");

    // Assert 20: Verify total audit events count is exactly 2
    expect(mockAuditEvents.length).toBe(2);

    // Assert 21: Verify no duplicate mail sends to same recipient
    mockUsers.forEach((user) => {
      const userMails = mockMailLogs.filter(
        (log) => log.recipientEmail === user.email
      );
      expect(userMails.length).toBe(1);
    });

    // Assert 22: Verify all mails sent at same timestamp (batch operation)
    mockMailLogs.forEach((log) => {
      expect(log.sentAt).toBe(systemExecutionTime.toISOString());
    });

    // Assert 23: Final verification - AI client invocation count matches mail count
    expect(mockAiClient.sendTemplateDistributionMail).toHaveBeenCalledTimes(1);
    const callArgs = (mockAiClient.sendTemplateDistributionMail as jest.Mock)
      .mock.calls[0];
    expect(callArgs[0].length).toBe(10);
  });
});