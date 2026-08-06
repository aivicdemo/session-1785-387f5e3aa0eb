import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx2Imp1Agent } from "../../src/agents/tx-2-imp-1/orchestrator";
import type { Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/orchestrator";
import type {
  UnsubmittedMember,
  ConfirmationEmailPayload,
  AuditLogEntry,
} from "../../src/logic/it-1";

// Mock AI client
class MockTx2Imp1AiClient implements Tx2Imp1AiClient {
  async checkAllReportSubmissionStatus(
    _targetDate: string,
    _departmentId: string,
    _memberIds: string[]
  ): Promise<UnsubmittedMember[]> {
    return [];
  }

  async judgeDelayedMembers(
    _reportSubmissions: Array<{
      memberId: string;
      submittedAt: string;
      deadline: string;
    }>
  ): Promise<string[]> {
    return [];
  }

  async generateConfirmationEmailContent(
    _unsubmittedCount: number,
    _delayedCount: number,
    _unsubmittedList: UnsubmittedMember[],
    _delayedList: Array<{ memberId: string; submittedAt: string }>
  ): Promise<{
    subject: string;
    body: string;
  }> {
    return {
      subject: "朝会報告 - 確認メール",
      body: `未送信部員：0名\n全部員が日報を送信済みです。`,
    };
  }

  async recordAuditLog(
    _eventType: string,
    _eventDetails: Record<string, unknown>
  ): Promise<AuditLogEntry> {
    return {
      id: "audit-001",
      eventType: _eventType,
      eventDetails: _eventDetails,
      recordedAt: new Date("2024-01-15T09:30:00Z").toISOString(),
    };
  }
}

// Mock email queue
class MockEmailQueue {
  private queue: ConfirmationEmailPayload[] = [];

  enqueue(payload: ConfirmationEmailPayload): void {
    this.queue.push(payload);
  }

  getQueue(): ConfirmationEmailPayload[] {
    return [...this.queue];
  }

  clear(): void {
    this.queue = [];
  }
}

describe("日報入力フォームの提供と送信機能 - 朝会開始前の日報送信確認", () => {
  let mockAiClient: MockTx2Imp1AiClient;
  let mockEmailQueue: MockEmailQueue;
  let auditLogs: AuditLogEntry[];

  beforeEach(() => {
    mockAiClient = new MockTx2Imp1AiClient();
    mockEmailQueue = new MockEmailQueue();
    auditLogs = [];
  });

  afterEach(() => {
    mockEmailQueue.clear();
    auditLogs = [];
  });

  // SCEN-282
  test("全部員が日報送信済みの場合、未送信リストは空で部長宛メールが生成される", async () => {
    // Setup: テスト対象日時と部門情報
    const targetDate = "2024-01-15";
    const departmentId = "dept-dev-001";
    const chiefEmail = "chief@example.com";
    const allMemberIds = [
      "member-001",
      "member-002",
      "member-003",
      "member-004",
      "member-005",
      "member-006",
      "member-007",
      "member-008",
      "member-009",
      "member-010",
    ];

    // 全部員の日報提出済みデータを準備
    const reportSubmissions = allMemberIds.map((memberId) => ({
      memberId,
      submittedAt: "2024-01-15T08:45:00Z",
      deadline: "2024-01-15T09:00:00Z",
    }));

    // Execute: AIエージェント実行
    const result = await runTx2Imp1Agent(
      mockAiClient,
      mockEmailQueue,
      auditLogs,
      {
        targetDate,
        departmentId,
        chiefEmail,
        allMemberIds,
        reportSubmissions,
        checkTimestamp: "2024-01-15T09:00:00Z",
      }
    );

    // Assert: 実行結果の検証
    expect(result).toBeDefined();
    expect(result.success).toBe(true);

    // 未提出者リストが空であることを確認
    expect(result.unsubmittedMembers).toEqual([]);
    expect(result.unsubmittedMembersCount).toBe(0);

    // 遅延者が0名であることを確認
    expect(result.delayedMembers).toEqual([]);
    expect(result.delayedMembersCount).toBe(0);

    // 生成されたメールが部長宛に作成されていることを確認
    const queuedEmails = mockEmailQueue.getQueue();
    expect(queuedEmails).toHaveLength(1);

    const email = queuedEmails[0];
    expect(email.recipientEmail).toBe(chiefEmail);
    expect(email.subject).toContain("朝会報告");
    expect(email.subject).toContain("確認メール");
    expect(email.body).toContain("未送信部員：0名");
    expect(email.body).toContain("全部員が日報を送信済みです");
    expect(email.generatedAt).toBeDefined();

    // メール送信キューへの登録を確認
    expect(email.status).toBe("queued");

    // 監査ログが記録されていることを確認
    expect(auditLogs).toHaveLength(1);
    const auditEntry = auditLogs[0];
    expect(auditEntry.eventType).toBe("REPORT_CHECK_COMPLETED");
    expect(auditEntry.eventDetails.unsubmittedCount).toBe(0);
    expect(auditEntry.eventDetails.delayedCount).toBe(0);
    expect(auditEntry.eventDetails.emailGenerationStatus).toBe("success");
    expect(auditEntry.recordedAt).toBeDefined();
  });
});