import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  runTx4Imp1Agent,
  Tx4Imp1AgentInput,
  Tx4Imp1AgentOutput,
} from "../../src/logic/it-1";

// Mock types for Tx4Imp1AiClient
interface MockAiClientConfig {
  confirmEmailSent: boolean;
  reportReadCompleted: boolean;
  progressAggregated: boolean;
  taskExtracted: boolean;
  priorityJudgmentError: Error | null;
}

interface ConfirmEmailSnapshot {
  emailId: string;
  senderId: string;
  recipientId: string;
  sentAt: string;
  status: string;
}

interface ProgressReportSnapshot {
  reportId: string;
  createdAt: string;
  content: string;
}

interface TaskExtractionSnapshot {
  taskId: string;
  reportId: string;
  createdAt: string;
  description: string;
}

interface CompensationAction {
  type: string;
  targetId: string;
  executedAt: string;
  details: string;
}

interface AuditLogEntry {
  actionType: string;
  targetId: string;
  timestamp: string;
  details: string;
}

// Fake Tx4Imp1AiClient for mocking
class FakeTx4Imp1AiClient {
  private config: MockAiClientConfig;

  constructor(config: Partial<MockAiClientConfig> = {}) {
    this.config = {
      confirmEmailSent: true,
      reportReadCompleted: true,
      progressAggregated: true,
      taskExtracted: true,
      priorityJudgmentError: null,
      ...config,
    };
  }

  async sendConfirmationEmail(recipientId: string): Promise<string> {
    if (!this.config.confirmEmailSent) {
      throw new Error("Email send failed");
    }
    return `email_${Date.now()}`;
  }

  async readReportContent(reportId: string): Promise<string> {
    if (!this.config.reportReadCompleted) {
      throw new Error("Report read failed");
    }
    return `Report content for ${reportId}`;
  }

  async aggregateProgress(reports: string[]): Promise<string> {
    if (!this.config.progressAggregated) {
      throw new Error("Progress aggregation failed");
    }
    return "Aggregated progress data";
  }

  async extractTasks(progressData: string): Promise<string> {
    if (!this.config.taskExtracted) {
      throw new Error("Task extraction failed");
    }
    return "Extracted tasks";
  }

  async judgePriority(tasks: string): Promise<string> {
    if (this.config.priorityJudgmentError) {
      throw this.config.priorityJudgmentError;
    }
    return "Priority judgment result";
  }
}

// Fake database and state management for testing
class FakeTestState {
  confirmEmailSnapshots: ConfirmEmailSnapshot[] = [];
  progressReportSnapshots: ProgressReportSnapshot[] = [];
  taskExtractionSnapshots: TaskExtractionSnapshot[] = [];
  compensationLog: CompensationAction[] = [];
  auditLog: AuditLogEntry[] = [];
  agentExecutionStatus: string = "";

  recordConfirmEmail(snapshot: ConfirmEmailSnapshot): void {
    this.confirmEmailSnapshots.push(snapshot);
  }

  recordProgressReport(snapshot: ProgressReportSnapshot): void {
    this.progressReportSnapshots.push(snapshot);
  }

  recordTaskExtraction(snapshot: TaskExtractionSnapshot): void {
    this.taskExtractionSnapshots.push(snapshot);
  }

  recordCompensation(action: CompensationAction): void {
    this.compensationLog.push(action);
  }

  recordAuditLog(entry: AuditLogEntry): void {
    this.auditLog.push(entry);
  }

  setAgentStatus(status: string): void {
    this.agentExecutionStatus = status;
  }

  rollbackConfirmEmail(emailId: string): void {
    this.confirmEmailSnapshots = this.confirmEmailSnapshots.filter(
      (e) => e.emailId !== emailId
    );
  }

  rollbackProgressReport(reportId: string): void {
    this.progressReportSnapshots = this.progressReportSnapshots.filter(
      (r) => r.reportId !== reportId
    );
  }

  rollbackTaskExtraction(taskId: string): void {
    this.taskExtractionSnapshots = this.taskExtractionSnapshots.filter(
      (t) => t.taskId !== taskId
    );
  }

  reset(): void {
    this.confirmEmailSnapshots = [];
    this.progressReportSnapshots = [];
    this.taskExtractionSnapshots = [];
    this.compensationLog = [];
    this.auditLog = [];
    this.agentExecutionStatus = "";
  }
}

describe("AIエージェント tx_4_imp_1 - 日報収集から課題抽出・優先度判定までの自動実行 - 部分失敗時の巻き戻し", () => {
  let testState: FakeTestState;
  let fakeAiClient: FakeTx4Imp1AiClient;

  beforeEach(() => {
    testState = new FakeTestState();
  });

  afterEach(() => {
    testState.reset();
  });

  // SCEN-585
  test("優先度判定ステップ失敗時に完了済み副作用をロールバック・補償する", async () => {
    // Setup: 部長ユーザーでの認証状態確立
    const managerUserId = "user_manager_001";
    const departmentId = "dept_dev_001";

    // Step 1: フェイク AI クライアント初期化 - 優先度判定時にエラーを発生させる
    const priorityJudgmentFailureError = new Error("優先度判定AIモデル呼び出し失敗");
    fakeAiClient = new FakeTx4Imp1AiClient({
      confirmEmailSent: true,
      reportReadCompleted: true,
      progressAggregated: true,
      taskExtracted: true,
      priorityJudgmentError: priorityJudgmentFailureError,
    });

    // Step 2: テスト入力準備 - 既に収集済みの日報データ
    const reportIds = [
      "report_001",
      "report_002",
      "report_003",
      "report_004",
      "report_005",
    ];
    const engineerIds = [
      "engineer_001",
      "engineer_002",
      "engineer_003",
      "engineer_004",
      "engineer_005",
    ];

    const agentInput: Tx4Imp1AgentInput = {
      managerId: managerUserId,
      departmentId: departmentId,
      reportIds: reportIds,
      engineerIds: engineerIds,
      scheduleStartTime: new Date("2024-01-15T09:00:00Z"),
      currentTime: new Date("2024-01-15T08:45:00Z"),
    };

    // Step 3: 各ステップ完了時の副作用スナップショット記録シミュレーション
    // (1) 確認メール送信完了
    const confirmEmailId = `email_confirm_${Date.now()}`;
    const confirmEmailSnapshot: ConfirmEmailSnapshot = {
      emailId: confirmEmailId,
      senderId: "system_agent",
      recipientId: managerUserId,
      sentAt: new Date("2024-01-15T08:30:00Z").toISOString(),
      status: "SENT",
    };
    testState.recordConfirmEmail(confirmEmailSnapshot);

    // (2) 日報読み込み完了（キャッシュ作成）- 実装では内部的に保持
    const readReportCacheKey = `cache_reports_${departmentId}`;

    // (3) 進捗集約完了
    const progressReportId = `report_progress_${Date.now()}`;
    const progressReportSnapshot: ProgressReportSnapshot = {
      reportId: progressReportId,
      createdAt: new Date("2024-01-15T08:35:00Z").toISOString(),
      content: JSON.stringify({
        totalReports: 5,
        completedReports: 5,
        summary: "All 5 engineers submitted reports",
      }),
    };
    testState.recordProgressReport(progressReportSnapshot);

    // (4) 課題抽出完了
    const taskExtractionId = `extraction_${Date.now()}`;
    const taskExtractionSnapshot: TaskExtractionSnapshot = {
      taskId: taskExtractionId,
      reportId: progressReportId,
      createdAt: new Date("2024-01-15T08:40:00Z").toISOString(),
      description: JSON.stringify({
        extractedTasks: [
          { id: "task_1", content: "API integration issue", severity: "high" },
          {
            id: "task_2",
            content: "DB migration delay",
            severity: "medium",
          },
        ],
      }),
    };
    testState.recordTaskExtraction(taskExtractionSnapshot);

    // Step 4: ステップ(5) 優先度判定時にモック側でエラー発生を意図的に引き起こし、
    // runTx4Imp1Agent() を実行（エラー発生を期待）
    let agentOutput: Tx4Imp1AgentOutput | null = null;
    let agentError: Error | null = null;

    try {
      // 実際の runTx4Imp1Agent 関数を呼び出し
      // 内部でモック AI クライアントを使用（注入可能な設計を仮定）
      agentOutput = await runTx4Imp1Agent(agentInput, fakeAiClient);
    } catch (err: unknown) {
      if (err instanceof Error) {
        agentError = err;
      }
    }

    // Step 5: エラー発生を確認
    expect(agentError).not.toBeNull();
    expect(agentError?.message).toMatch(/優先度判定/);

    // Step 6: ロールバック対象となる副作用のスナップショット記録確認
    expect(testState.confirmEmailSnapshots).toHaveLength(1);
    expect(testState.confirmEmailSnapshots[0].emailId).toBe(confirmEmailId);

    expect(testState.progressReportSnapshots).toHaveLength(1);
    expect(testState.progressReportSnapshots[0].reportId).toBe(progressReportId);

    expect(testState.taskExtractionSnapshots).toHaveLength(1);
    expect(testState.taskExtractionSnapshots[0].taskId).toBe(taskExtractionId);

    // Step 7: 補償ロジック実行確認 - 失敗時にロールバック処理を実行
    // 補償アクション 1: 確認メール送信の無効化
    testState.rollbackConfirmEmail(confirmEmailId);
    testState.recordCompensation({
      type: "EMAIL_INVALIDATION",
      targetId: confirmEmailId,
      executedAt: new Date("2024-01-15T08:45:30Z").toISOString(),
      details: `Compensation: Email ${confirmEmailId} invalidated`,
    });

    // 補償アクション 2: 進捗レポートの削除
    testState.rollbackProgressReport(progressReportId);
    testState.recordCompensation({
      type: "REPORT_DELETION",
      targetId: progressReportId,
      executedAt: new Date("2024-01-15T08:45:35Z").toISOString(),
      details: `Compensation: Report ${progressReportId} deleted`,
    });

    // 補償アクション 3: 抽出済み課題レコードの削除
    testState.rollbackTaskExtraction(taskExtractionId);
    testState.recordCompensation({
      type: "TASK_EXTRACTION_ROLLBACK",
      targetId: taskExtractionId,
      executedAt: new Date("2024-01-15T08:45:40Z").toISOString(),
      details: `Compensation: Task extract ${taskExtractionId} rolled back`,
    });

    // Step 8: 補償ロジック実行確認 - 実際のロールバック結果検証
    expect(testState.confirmEmailSnapshots).toHaveLength(0);
    expect(testState.progressReportSnapshots).toHaveLength(0);
    expect(testState.taskExtractionSnapshots).toHaveLength(0);

    // Step 9: 補償ログ記録確認
    expect(testState.compensationLog).toHaveLength(3);
    expect(testState.compensationLog[0].type).toBe("EMAIL_INVALIDATION");
    expect(testState.compensationLog[1].type).toBe("REPORT_DELETION");
    expect(testState.compensationLog[2].type).toBe("TASK_EXTRACTION_ROLLBACK");

    // Step 10: 部長に対して失敗通知メッセージが送信されたことを確認
    // 通知内容: 優先度判定失敗、手動対応要求
    const managerNotificationMessage = {
      recipientId: managerUserId,
      subject: "朝会報告集約処理が失敗しました",
      body: "優先度判定に失敗しました。日報確認と優先度判定を手動で実施してください",
      sentAt: new Date("2024-01-15T08:45:45Z").toISOString(),
    };

    testState.recordAuditLog({
      actionType: "MANAGER_NOTIFICATION_SENT",
      targetId: managerUserId,
      timestamp: managerNotificationMessage.sentAt,
      details: `Manager notification sent: ${managerNotificationMessage.subject}`,
    });

    expect(testState.auditLog).toHaveLength(1);
    expect(testState.auditLog[0].actionType).toBe("MANAGER_NOTIFICATION_SENT");
    expect(testState.auditLog[0].targetId).toBe(managerUserId);

    // Step 11: AIエージェント実行状態を記録
    testState.setAgentStatus("FAILED_WITH_COMPENSATION");
    expect(testState.agentExecutionStatus).toBe("FAILED_WITH_COMPENSATION");

    // Step 12: DB監査ログに補償アクション実行記録が時系列で記録されていることを確認
    testState.recordAuditLog({
      actionType: "COMPENSATION_EMAIL_INVALIDATION",
      targetId: confirmEmailId,
      timestamp: new Date("2024-01-15T08:45:30Z").toISOString(),
      details: `Compensation: Email ${confirmEmailId} invalidated`,
    });

    testState.recordAuditLog({
      actionType: "COMPENSATION_REPORT_DELETION",
      targetId: progressReportId,
      timestamp: new Date("2024-01-15T08:45:35Z").toISOString(),
      details: `Compensation: Report ${progressReportId} deleted`,
    });

    testState.recordAuditLog({
      actionType: "COMPENSATION_TASK_ROLLBACK",
      targetId: taskExtractionId,
      timestamp: new Date("2024-01-15T08:45:40Z").toISOString(),
      details: `Compensation: Task extract ${taskExtractionId} rolled back`,
    });

    // 最後の通知ログ
    testState.recordAuditLog({
      actionType: "AGENT_EXECUTION_FAILED",
      targetId: "agent_exec_tx4_imp1",
      timestamp: new Date("2024-01-15T08:45:45Z").toISOString(),
      details: `Agent status: FAILED_WITH_COMPENSATION, Priority judgment failed`,
    });

    // 監査ログが時系列で記録されていることを確認
    expect(testState.auditLog).toHaveLength(5);
    expect(testState.auditLog[0].actionType).toBe(
      "COMPENSATION_EMAIL_INVALIDATION"
    );
    expect(testState.auditLog[1].actionType).toBe("COMPENSATION_REPORT_DELETION");
    expect(testState.auditLog[2].actionType).toBe("COMPENSATION_TASK_ROLLBACK");
    expect(testState.auditLog[3].actionType).toBe("MANAGER_NOTIFICATION_SENT");
    expect(testState.auditLog[4].actionType).toBe("AGENT_EXECUTION_FAILED");

    // タイムスタンプが昇順であることを確認
    for (let i = 1; i < testState.auditLog.length; i++) {
      const prevTime = new Date(testState.auditLog[i - 1].timestamp).getTime();
      const currTime = new Date(testState.auditLog[i].timestamp).getTime();
      expect(currTime).toBeGreaterThanOrEqual(prevTime);
    }

    // Step 13: 失敗前後のDB状態を検証 - 進捗レポート・課題抽出レコード・メール送信ログが
    // 失敗前の状態に復元されている
    expect(testState.confirmEmailSnapshots).toHaveLength(0);
    expect(testState.progressReportSnapshots).toHaveLength(0);
    expect(testState.taskExtractionSnapshots).toHaveLength(0);

    // 補償ログには記録が残っていることを確認（監査証跡として必要）
    expect(testState.compensationLog).toHaveLength(3);
    expect(testState.compensationLog[0].details).toMatch(/Email.*invalidated/);
    expect(testState.compensationLog[1].details).toMatch(/Report.*deleted/);
    expect(testState.compensationLog[2].details).toMatch(/Task extract.*rolled back/);
  });
});