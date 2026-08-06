import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx3Imp1Agent } from "../../src/agents/tx-3-imp-1/orchestrator";
import type {
  Tx3Imp1AiClient,
  Tx3Imp1AgentResult,
} from "../../src/agents/tx-3-imp-1/types";

interface MockMailSendResult {
  success: boolean;
  statusCode: number;
  errorMessage?: string;
}

interface MockChatSendResult {
  success: boolean;
  statusCode: number;
  errorMessage?: string;
}

interface EscalationPayload {
  reportMissingMembers: Array<{
    userId: string;
    userName: string;
    reason: string;
  }>;
  judgmentRuleResult: Record<string, unknown>;
  systemErrorDetail: {
    statusCode: number;
    message: string;
    timestamp: string;
  };
  draftPromptMessages: string[];
}

interface SendHistoryRecord {
  id: string;
  userId: string;
  attemptedAt: string;
  status: "pending" | "sent" | "failed_holding" | "escalated";
  errorDetail?: string;
  createdAt: string;
}

interface HumanReviewTask {
  id: string;
  assignedTo: string;
  status: "unreviewed" | "approved" | "rejected";
  escalationPayload: EscalationPayload;
  createdAt: string;
}

class MockTx3Imp1AiClient implements Tx3Imp1AiClient {
  private mailSendResult: MockMailSendResult = { success: true, statusCode: 200 };
  private chatSendResult: MockChatSendResult = { success: true, statusCode: 200 };
  private executionLog: Array<{
    action: string;
    timestamp: string;
    detail?: Record<string, unknown>;
  }> = [];

  setMailSendFailure(statusCode: number, errorMessage: string): void {
    this.mailSendResult = {
      success: false,
      statusCode,
      errorMessage,
    };
  }

  setChatSendFailure(statusCode: number, errorMessage: string): void {
    this.chatSendResult = {
      success: false,
      statusCode,
      errorMessage,
    };
  }

  getExecutionLog(): Array<{
    action: string;
    timestamp: string;
    detail?: Record<string, unknown>;
  }> {
    return this.executionLog;
  }

  async identifyReportMissingMembers(
    confirmationEmailContent: string
  ): Promise<
    Array<{
      userId: string;
      userName: string;
      reason: "unreported" | "delayed";
    }>
  > {
    this.executionLog.push({
      action: "identify_report_missing_members",
      timestamp: new Date("2024-01-15T08:45:00Z").toISOString(),
      detail: { emailContentLength: confirmationEmailContent.length },
    });
    return [
      { userId: "user_001", userName: "Alice", reason: "unreported" },
      { userId: "user_002", userName: "Bob", reason: "delayed" },
      { userId: "user_003", userName: "Charlie", reason: "unreported" },
    ];
  }

  async judgePromptTargets(
    missingMembers: Array<{
      userId: string;
      userName: string;
      reason: "unreported" | "delayed";
    }>
  ): Promise<{
    targets: Array<{ userId: string; priority: number }>;
    ruleApplied: string;
  }> {
    this.executionLog.push({
      action: "judge_prompt_targets",
      timestamp: new Date("2024-01-15T08:46:00Z").toISOString(),
      detail: { memberCount: missingMembers.length },
    });
    return {
      targets: [
        { userId: "user_001", priority: 1 },
        { userId: "user_002", priority: 2 },
        { userId: "user_003", priority: 1 },
      ],
      ruleApplied: "unreported_priority_over_delayed",
    };
  }

  async sendPromptMailAndChat(
    targetUserId: string,
    targetUserName: string,
    promptContent: string
  ): Promise<{
    mailResult: MockMailSendResult;
    chatResult: MockChatSendResult;
    draftContent: string;
  }> {
    this.executionLog.push({
      action: "send_prompt_mail_and_chat",
      timestamp: new Date("2024-01-15T08:47:00Z").toISOString(),
      detail: { targetUserId, targetUserName },
    });

    return {
      mailResult: this.mailSendResult,
      chatResult: this.chatSendResult,
      draftContent: `[催促] ${targetUserName}さんへ：まだ日報を送信していないようです。朝会開始までにお願いします。`,
    };
  }

  async recordSendResult(
    sendHistoryRecord: SendHistoryRecord
  ): Promise<{ recorded: boolean; recordId: string }> {
    this.executionLog.push({
      action: "record_send_result",
      timestamp: new Date("2024-01-15T08:48:00Z").toISOString(),
      detail: { status: sendHistoryRecord.status, userId: sendHistoryRecord.userId },
    });
    return {
      recorded: true,
      recordId: `history_${Date.now()}`,
    };
  }

  async escalateToHumanReview(
    escalationPayload: EscalationPayload
  ): Promise<{ escalated: boolean; taskId: string }> {
    this.executionLog.push({
      action: "escalate_to_human_review",
      timestamp: new Date("2024-01-15T08:49:00Z").toISOString(),
      detail: {
        memberCount: escalationPayload.reportMissingMembers.length,
        errorStatusCode: escalationPayload.systemErrorDetail.statusCode,
      },
    });
    return {
      escalated: true,
      taskId: `task_${Date.now()}`,
    };
  }

  resetMocks(): void {
    this.mailSendResult = { success: true, statusCode: 200 };
    this.chatSendResult = { success: true, statusCode: 200 };
    this.executionLog = [];
  }
}

class MockSendHistoryRepository {
  private records: SendHistoryRecord[] = [];

  async save(record: SendHistoryRecord): Promise<SendHistoryRecord> {
    this.records.push(record);
    return record;
  }

  async findByUserAndDate(
    userId: string,
    date: string
  ): Promise<SendHistoryRecord | null> {
    return (
      this.records.find(
        (r) =>
          r.userId === userId &&
          r.createdAt.startsWith(date) &&
          r.status !== "pending"
      ) || null
    );
  }

  getAllRecords(): SendHistoryRecord[] {
    return this.records;
  }

  clear(): void {
    this.records = [];
  }
}

class MockHumanReviewTaskRepository {
  private tasks: HumanReviewTask[] = [];

  async save(task: HumanReviewTask): Promise<HumanReviewTask> {
    this.tasks.push(task);
    return task;
  }

  async findByAssignee(assignee: string): Promise<HumanReviewTask[]> {
    return this.tasks.filter((t) => t.assignedTo === assignee);
  }

  getAllTasks(): HumanReviewTask[] {
    return this.tasks;
  }

  clear(): void {
    this.tasks = [];
  }
}

describe("Tx3Imp1Agent - Escalation on Mail/Chat Send System Error", () => {
  let aiClient: MockTx3Imp1AiClient;
  let sendHistoryRepository: MockSendHistoryRepository;
  let humanReviewRepository: MockHumanReviewTaskRepository;

  beforeEach(() => {
    aiClient = new MockTx3Imp1AiClient();
    sendHistoryRepository = new MockSendHistoryRepository();
    humanReviewRepository = new MockHumanReviewTaskRepository();
  });

  afterEach(() => {
    aiClient.resetMocks();
    sendHistoryRepository.clear();
    humanReviewRepository.clear();
  });

  // SCEN-561
  test("should escalate to human review when mail/chat send encounters system error before confirming side effects", async () => {
    // Setup: Verify send history is empty before agent execution
    const initialSendHistory = sendHistoryRepository.getAllRecords();
    expect(initialSendHistory).toHaveLength(0);

    // Setup: Confirmation email content with 3 missing members
    const confirmationEmailContent = `
      Subject: 朝会報告状況確認
      Date: 2024-01-15T08:30:00Z
      
      以下のメンバーからの報告が未着です：
      - user_001: Alice - 未報告
      - user_002: Bob - 遅延（朝会開始時刻を超過）
      - user_003: Charlie - 未報告
    `;

    // Setup: Configure mail/chat send API stubs to return system error (500)
    aiClient.setMailSendFailure(
      500,
      "Internal Server Error: Mail service temporarily unavailable"
    );
    aiClient.setChatSendFailure(
      500,
      "Internal Server Error: Chat service temporarily unavailable"
    );

    // Execute: Run Tx3Imp1Agent orchestrator
    const result: Tx3Imp1AgentResult = await runTx3Imp1Agent(
      {
        confirmationEmailContent,
        morningMeetingStartTime: "2024-01-15T09:00:00Z",
        executionTimestamp: "2024-01-15T08:50:00Z",
      },
      {
        aiClient,
        sendHistoryRepository,
        humanReviewRepository,
      }
    );

    // Verify: Action "identify_report_missing_members" completed
    const executionLog = aiClient.getExecutionLog();
    const identifyAction = executionLog.find(
      (log) => log.action === "identify_report_missing_members"
    );
    expect(identifyAction).toBeDefined();

    // Verify: Action "judge_prompt_targets" completed
    const judgeAction = executionLog.find(
      (log) => log.action === "judge_prompt_targets"
    );
    expect(judgeAction).toBeDefined();

    // Verify: Action "send_prompt_mail_and_chat" executed and system error received
    const sendAction = executionLog.find(
      (log) => log.action === "send_prompt_mail_and_chat"
    );
    expect(sendAction).toBeDefined();

    // Verify: Action "record_send_result" completed with error status
    const recordAction = executionLog.find(
      (log) => log.action === "record_send_result"
    );
    expect(recordAction).toBeDefined();
    expect(recordAction?.detail?.status).toBe("failed_holding");

    // Verify: Action "escalate_to_human_review" triggered on system error
    const escalateAction = executionLog.find(
      (log) => log.action === "escalate_to_human_review"
    );
    expect(escalateAction).toBeDefined();
    expect(escalateAction?.detail?.errorStatusCode).toBe(500);

    // Verify: Escalation payload contains required information
    expect(result.escalated).toBe(true);
    expect(result.escalationReason).toBe("System error on mail/chat send");
    expect(result.humanReviewRequired).toBe(true);

    // Verify: Human review task created with unreviewed status
    const humanReviewTasks = humanReviewRepository.getAllTasks();
    expect(humanReviewTasks).toHaveLength(1);

    const task = humanReviewTasks[0];
    expect(task.status).toBe("unreviewed");
    expect(task.assignedTo).toBe("department_head");

    // Verify: Escalation payload contains (1) 3 missing members info
    expect(task.escalationPayload.reportMissingMembers).toHaveLength(3);
    expect(task.escalationPayload.reportMissingMembers[0]).toEqual(
      expect.objectContaining({
        userId: "user_001",
        userName: "Alice",
        reason: "unreported",
      })
    );
    expect(task.escalationPayload.reportMissingMembers[1]).toEqual(
      expect.objectContaining({
        userId: "user_002",
        userName: "Bob",
        reason: "delayed",
      })
    );
    expect(task.escalationPayload.reportMissingMembers[2]).toEqual(
      expect.objectContaining({
        userId: "user_003",
        userName: "Charlie",
        reason: "unreported",
      })
    );

    // Verify: Escalation payload contains (2) judgment rule result
    expect(task.escalationPayload.judgmentRuleResult).toBeDefined();
    expect(task.escalationPayload.judgmentRuleResult.ruleApplied).toBe(
      "unreported_priority_over_delayed"
    );

    // Verify: Escalation payload contains (3) system error details
    expect(task.escalationPayload.systemErrorDetail.statusCode).toBe(500);
    expect(task.escalationPayload.systemErrorDetail.message).toMatch(
      /Internal Server Error/
    );

    // Verify: Draft prompt messages included for human review
    expect(task.escalationPayload.draftPromptMessages.length).toBeGreaterThan(0);

    // Verify: Send history records exist with failed_holding status
    const sendHistoryRecords = sendHistoryRepository.getAllRecords();
    expect(sendHistoryRecords.length).toBeGreaterThan(0);

    const failedRecord = sendHistoryRecords.find(
      (r) => r.status === "failed_holding"
    );
    expect(failedRecord).toBeDefined();
    expect(failedRecord?.errorDetail).toMatch(/500/);

    // Verify: Side effects (actual mail/chat send) not confirmed
    const sentRecords = sendHistoryRecords.filter(
      (r) => r.status === "sent"
    );
    expect(sentRecords).toHaveLength(0);

    // Verify: Agent execution completes without throwing exception
    expect(result).toBeDefined();

    // Verify: Return value contains escalation indicator
    expect(result.escalated).toBe(true);
    expect(result.escalationReason).toBe("System error on mail/chat send");
    expect(result.humanReviewRequired).toBe(true);

    // Verify: Send history holds pending state until human approval
    expect(result.sendHistoryStatus).toBe("holding_for_human_review");
  });
});