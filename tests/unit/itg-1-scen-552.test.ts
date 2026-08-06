import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";

// Mock AI client interface
interface Tx2Imp1AiClient {
  identifyUnsubmittedMembers(params: {
    allMemberStatuses: Array<{ memberId: string; submittedAt: string | null }>;
    deadlineTime: string;
  }): Promise<{
    unsubmittedMembers: string[];
    delayedMembers: string[];
  }>;
  generateNotificationList(params: {
    unsubmittedMembers: string[];
    delayedMembers: string[];
  }): Promise<{
    unsubmittedList: Array<{ memberId: string; status: string }>;
    delayedList: Array<{ memberId: string; status: string }>;
  }>;
  sendNotificationEmail(params: {
    recipientId: string;
    unsubmittedCount: number;
    delayedCount: number;
    unsubmittedList: Array<{ memberId: string; status: string }>;
    delayedList: Array<{ memberId: string; status: string }>;
  }): Promise<{ emailSentId: string; sentAt: string }>;
}

// Mock database interface
interface MockDatabase {
  unsubmittedMembersTable: Array<{
    memberId: string;
    executionId: string;
    recordedAt: string;
  }>;
  agentExecutionHistoryTable: Array<{
    executionId: string;
    agentName: string;
    executedAt: string;
    targetDate: string;
    status: string;
  }>;
  notificationSendHistoryTable: Array<{
    notificationId: string;
    executionId: string;
    recipientId: string;
    emailSentId: string;
    sentAt: string;
    messageType: string;
  }>;
  transactionLogTable: Array<{
    executionId: string;
    logType: string;
    details: string;
    recordedAt: string;
  }>;
}

// Import the actual agent function
import { runTx2Imp1Agent } from "../../src/logic/it-1";

describe("朝会報告管理システム - 日報収集から報告漏れ特定までの自動判定と通知 - 冪等性制御", () => {
  let mockDb: MockDatabase;
  let mockAiClient: Tx2Imp1AiClient;
  let aiClientCallCount: {
    identifyUnsubmittedMembers: number;
    generateNotificationList: number;
    sendNotificationEmail: number;
  };

  beforeEach(() => {
    // Initialize mock database
    mockDb = {
      unsubmittedMembersTable: [],
      agentExecutionHistoryTable: [],
      notificationSendHistoryTable: [],
      transactionLogTable: [],
    };

    // Initialize call counter
    aiClientCallCount = {
      identifyUnsubmittedMembers: 0,
      generateNotificationList: 0,
      sendNotificationEmail: 0,
    };

    // Create mock AI client
    mockAiClient = {
      identifyUnsubmittedMembers: async (params) => {
        aiClientCallCount.identifyUnsubmittedMembers++;
        return {
          unsubmittedMembers: ["member_9", "member_10"],
          delayedMembers: [],
        };
      },
      generateNotificationList: async (params) => {
        aiClientCallCount.generateNotificationList++;
        return {
          unsubmittedList: [
            { memberId: "member_9", status: "unsubmitted" },
            { memberId: "member_10", status: "unsubmitted" },
          ],
          delayedList: [],
        };
      },
      sendNotificationEmail: async (params) => {
        aiClientCallCount.sendNotificationEmail++;
        const emailSentId = `email_${Date.now()}`;
        const sentAt = "2024-01-15T06:30:00Z";
        return {
          emailSentId,
          sentAt,
        };
      },
    };
  });

  afterEach(() => {
    mockDb = {} as MockDatabase;
    mockAiClient = {} as Tx2Imp1AiClient;
  });

  // SCEN-552
  test("should prevent duplicate agent execution using idempotency control and not duplicate unsubmitted member records or notification emails", async () => {
    const executionDate = "2024-01-15";
    const deadlineTime = "2024-01-15T06:00:00Z";
    const directorId = "director_a";

    // Prepare 10 members: 8 submitted on 2024-01-14T18:00:00Z, 2 unsubmitted
    const allMemberStatuses = [
      {
        memberId: "member_1",
        submittedAt: "2024-01-14T18:00:00Z",
      },
      {
        memberId: "member_2",
        submittedAt: "2024-01-14T18:00:00Z",
      },
      {
        memberId: "member_3",
        submittedAt: "2024-01-14T18:00:00Z",
      },
      {
        memberId: "member_4",
        submittedAt: "2024-01-14T18:00:00Z",
      },
      {
        memberId: "member_5",
        submittedAt: "2024-01-14T18:00:00Z",
      },
      {
        memberId: "member_6",
        submittedAt: "2024-01-14T18:00:00Z",
      },
      {
        memberId: "member_7",
        submittedAt: "2024-01-14T18:00:00Z",
      },
      {
        memberId: "member_8",
        submittedAt: "2024-01-14T18:00:00Z",
      },
      {
        memberId: "member_9",
        submittedAt: null,
      },
      {
        memberId: "member_10",
        submittedAt: null,
      },
    ];

    // First execution
    const firstExecutionId = `exec_${Date.now()}_first`;
    const firstExecutionResult = await runTx2Imp1Agent({
      executionId: firstExecutionId,
      executionDate,
      deadlineTime,
      directorId,
      allMemberStatuses,
      mockDb,
      mockAiClient,
    });

    // Verify first execution completed successfully
    expect(firstExecutionResult.status).toBe("completed");
    expect(firstExecutionResult.unsubmittedCount).toBe(2);
    expect(firstExecutionResult.delayedCount).toBe(0);
    expect(firstExecutionResult.notificationEmailSentCount).toBe(1);

    // Verify unsubmitted members table has 2 records after first execution
    const unsubmittedAfterFirst = mockDb.unsubmittedMembersTable.filter(
      (record) => record.executionId === firstExecutionId
    );
    expect(unsubmittedAfterFirst).toHaveLength(2);
    expect(unsubmittedAfterFirst.map((r) => r.memberId).sort()).toEqual([
      "member_10",
      "member_9",
    ]);

    // Verify agent execution history has 1 record
    const executionHistoryAfterFirst = mockDb.agentExecutionHistoryTable.filter(
      (record) => record.executionId === firstExecutionId
    );
    expect(executionHistoryAfterFirst).toHaveLength(1);
    expect(executionHistoryAfterFirst[0].agentName).toBe("tx_2_imp_1");
    expect(executionHistoryAfterFirst[0].status).toBe("completed");

    // Verify notification send history has 1 record
    const notificationHistoryAfterFirst =
      mockDb.notificationSendHistoryTable.filter(
        (record) => record.executionId === firstExecutionId
      );
    expect(notificationHistoryAfterFirst).toHaveLength(1);
    expect(notificationHistoryAfterFirst[0].recipientId).toBe(directorId);
    expect(notificationHistoryAfterFirst[0].messageType).toBe(
      "unsubmitted_members_notification"
    );

    // Record initial state
    const unsubmittedCountAfterFirst =
      mockDb.unsubmittedMembersTable.length;
    const notificationCountAfterFirst =
      mockDb.notificationSendHistoryTable.length;
    const aiClientSendEmailCallCountAfterFirst =
      aiClientCallCount.sendNotificationEmail;

    // Second execution with same parameters (idempotency test)
    const secondExecutionId = `exec_${Date.now()}_second`;
    const secondExecutionResult = await runTx2Imp1Agent({
      executionId: secondExecutionId,
      executionDate,
      deadlineTime,
      directorId,
      allMemberStatuses,
      mockDb,
      mockAiClient,
    });

    // Verify second execution was skipped due to idempotency
    expect(secondExecutionResult.status).toBe("skipped_idempotent");
    expect(secondExecutionResult.duplicateDetectionReason).toContain(
      "idempotency"
    );

    // Verify unsubmitted members table still has only 2 records (no duplicates)
    const totalUnsubmittedAfterSecond =
      mockDb.unsubmittedMembersTable.length;
    expect(totalUnsubmittedAfterSecond).toBe(unsubmittedCountAfterFirst);

    // Verify notification send history still has only 1 record (no duplicates)
    const totalNotificationAfterSecond =
      mockDb.notificationSendHistoryTable.length;
    expect(totalNotificationAfterSecond).toBe(notificationCountAfterFirst);

    // Verify AI client send email method was called only once
    expect(aiClientCallCount.sendNotificationEmail).toBe(
      aiClientSendEmailCallCountAfterFirst
    );

    // Verify transaction log recorded idempotency detection
    const transactionLogs = mockDb.transactionLogTable.filter(
      (log) =>
        log.executionId === secondExecutionId && log.logType === "idempotent_skip"
    );
    expect(transactionLogs.length).toBeGreaterThan(0);
    expect(transactionLogs[0].details).toContain("idempotency_key");
  });
});