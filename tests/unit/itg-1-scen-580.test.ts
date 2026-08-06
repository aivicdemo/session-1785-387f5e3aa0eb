import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx4Imp1Agent } from "../../src/agents/tx-4-imp-1/orchestrator";

interface MockAiClientConfig {
  shouldReturnInvalidJson?: boolean;
  shouldOmitRequiredField?: boolean;
  shouldReturnAmbiguousReason?: boolean;
  shouldReturnLowConfidenceScore?: boolean;
  shouldReturnEqualPriorityScores?: boolean;
}

interface FakeTx4Imp1AiClient {
  config: MockAiClientConfig;
  generateConfirmationEmail(): Promise<string>;
  readDailyReportContent(emailContent: string): Promise<string>;
  aggregateProgressStatus(reports: string[]): Promise<string>;
  extractChallenges(aggregatedData: string): Promise<ExtractedChallenge[]>;
  prioritizeAndClassify(challenges: ExtractedChallenge[]): Promise<PrioritizedChallenge[]>;
}

interface ExtractedChallenge {
  id: string;
  description: string;
  reason: string;
  confidenceScore?: number;
}

interface PrioritizedChallenge {
  id: string;
  description: string;
  priority: "high" | "medium" | "low";
  priorityScore?: number;
  reasoning?: string;
}

interface EscalationNotification {
  recipientEmail: string;
  errorLocation: "challenge_extraction" | "priority_judgement";
  confidenceScore: number | null;
  rejectedContent: Record<string, unknown>;
  requiresManualReview: boolean;
  timestamp: string;
}

interface AuditLogEntry {
  eventType: "escalation_triggered";
  reason: string;
  timestamp: string;
  rejectedOutput: Record<string, unknown>;
}

class Tx4Imp1AiClientMock implements FakeTx4Imp1AiClient {
  config: MockAiClientConfig;

  constructor(config: MockAiClientConfig = {}) {
    this.config = config;
  }

  async generateConfirmationEmail(): Promise<string> {
    return "確認メール送信完了";
  }

  async readDailyReportContent(emailContent: string): Promise<string> {
    return "日報データ読み込み: 正常";
  }

  async aggregateProgressStatus(reports: string[]): Promise<string> {
    return "全体進捗集約: 完了";
  }

  async extractChallenges(aggregatedData: string): Promise<ExtractedChallenge[]> {
    if (this.config.shouldReturnInvalidJson) {
      throw new Error("JSON形式の不正: パースエラー");
    }

    const challenges: ExtractedChallenge[] = [
      {
        id: "ch-001",
        description: "データベース接続タイムアウト",
        reason: this.config.shouldReturnAmbiguousReason
          ? "システムに問題がある"
          : "本番環境の負荷増加により接続遅延が発生",
        confidenceScore: this.config.shouldReturnLowConfidenceScore ? 0.35 : 0.85,
      },
      {
        id: "ch-002",
        description: "API仕様の認識齟齬",
        reason: "チーム間の仕様確認ミス",
        confidenceScore: 0.72,
      },
    ];

    if (this.config.shouldOmitRequiredField) {
      challenges[0] = {
        id: "ch-001",
        description: "データベース接続タイムアウト",
      };
    }

    return challenges;
  }

  async prioritizeAndClassify(
    challenges: ExtractedChallenge[]
  ): Promise<PrioritizedChallenge[]> {
    if (this.config.shouldReturnEqualPriorityScores) {
      return [
        {
          id: "ch-001",
          description: "データベース接続タイムアウト",
          priority: "high",
          priorityScore: 0.75,
          reasoning: "運用継続への影響大",
        },
        {
          id: "ch-002",
          description: "API仕様の認識齟齬",
          priority: "high",
          priorityScore: 0.75,
          reasoning: "開発進捗への影響大",
        },
      ];
    }

    return [
      {
        id: "ch-001",
        description: "データベース接続タイムアウト",
        priority: "high",
        priorityScore: 0.89,
        reasoning: "本番環境の即時対応が必要",
      },
      {
        id: "ch-002",
        description: "API仕様の認識齟齬",
        priority: "medium",
        priorityScore: 0.62,
        reasoning: "次スプリントで解決可能",
      },
    ];
  }
}

describe("日報収集から課題抽出・優先度判定までの自動実行 - 不正・曖昧・低確信度AI出力の拒否", () => {
  let mockAiClient: Tx4Imp1AiClientMock;
  let escalationNotifications: EscalationNotification[] = [];
  let auditLogs: AuditLogEntry[] = [];

  beforeEach(() => {
    escalationNotifications = [];
    auditLogs = [];
    mockAiClient = new Tx4Imp1AiClientMock();
  });

  afterEach(() => {
    escalationNotifications = [];
    auditLogs = [];
  });

  // SCEN-580
  test("should reject invalid JSON from challenge extraction and trigger escalation", async () => {
    mockAiClient.config.shouldReturnInvalidJson = true;

    let escalationConditionFlag = false;
    let caughtError: Error | null = null;

    try {
      await runTx4Imp1Agent({
        aiClient: mockAiClient,
        managerEmail: "manager@example.com",
        reportDeadline: new Date("2024-01-15T08:00:00Z"),
        onEscalation: (notification: EscalationNotification) => {
          escalationConditionFlag = true;
          escalationNotifications.push(notification);
        },
        onAuditLog: (entry: AuditLogEntry) => {
          auditLogs.push(entry);
        },
      });
    } catch (error) {
      caughtError = error instanceof Error ? error : new Error(String(error));
    }

    expect(escalationConditionFlag).toBe(true);
    expect(caughtError).toBeDefined();
    expect(caughtError?.message).toMatch(/JSON|パース|形式/i);
    expect(escalationNotifications).toHaveLength(1);
    expect(escalationNotifications[0]?.errorLocation).toBe("challenge_extraction");
    expect(escalationNotifications[0]?.requiresManualReview).toBe(true);
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0]?.eventType).toBe("escalation_triggered");
    expect(auditLogs[0]?.reason).toMatch(/JSON|形式/i);
  });

  test("should reject missing required field in challenge extraction and trigger escalation", async () => {
    mockAiClient.config.shouldOmitRequiredField = true;

    let escalationConditionFlag = false;
    let caughtError: Error | null = null;

    try {
      await runTx4Imp1Agent({
        aiClient: mockAiClient,
        managerEmail: "manager@example.com",
        reportDeadline: new Date("2024-01-15T08:00:00Z"),
        onEscalation: (notification: EscalationNotification) => {
          escalationConditionFlag = true;
          escalationNotifications.push(notification);
        },
        onAuditLog: (entry: AuditLogEntry) => {
          auditLogs.push(entry);
        },
      });
    } catch (error) {
      caughtError = error instanceof Error ? error : new Error(String(error));
    }

    expect(escalationConditionFlag).toBe(true);
    expect(caughtError).toBeDefined();
    expect(caughtError?.message).toMatch(/必須|フィールド|欠落/i);
    expect(escalationNotifications).toHaveLength(1);
    expect(escalationNotifications[0]?.errorLocation).toBe("challenge_extraction");
    expect(escalationNotifications[0]?.requiresManualReview).toBe(true);
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0]?.reason).toMatch(/必須|フィールド/i);
  });

  test("should reject ambiguous challenge reasoning and trigger escalation", async () => {
    mockAiClient.config.shouldReturnAmbiguousReason = true;

    let escalationConditionFlag = false;
    let caughtError: Error | null = null;

    try {
      await runTx4Imp1Agent({
        aiClient: mockAiClient,
        managerEmail: "manager@example.com",
        reportDeadline: new Date("2024-01-15T08:00:00Z"),
        onEscalation: (notification: EscalationNotification) => {
          escalationConditionFlag = true;
          escalationNotifications.push(notification);
        },
        onAuditLog: (entry: AuditLogEntry) => {
          auditLogs.push(entry);
        },
      });
    } catch (error) {
      caughtError = error instanceof Error ? error : new Error(String(error));
    }

    expect(escalationConditionFlag).toBe(true);
    expect(caughtError).toBeDefined();
    expect(caughtError?.message).toMatch(/曖昧|根拠|判定/i);
    expect(escalationNotifications).toHaveLength(1);
    expect(escalationNotifications[0]?.errorLocation).toBe("challenge_extraction");
    expect(escalationNotifications[0]?.requiresManualReview).toBe(true);
    expect(auditLogs).toHaveLength(1);
  });

  test("should reject low confidence score and trigger escalation", async () => {
    mockAiClient.config.shouldReturnLowConfidenceScore = true;

    let escalationConditionFlag = false;
    let caughtError: Error | null = null;

    try {
      await runTx4Imp1Agent({
        aiClient: mockAiClient,
        managerEmail: "manager@example.com",
        reportDeadline: new Date("2024-01-15T08:00:00Z"),
        onEscalation: (notification: EscalationNotification) => {
          escalationConditionFlag = true;
          escalationNotifications.push(notification);
        },
        onAuditLog: (entry: AuditLogEntry) => {
          auditLogs.push(entry);
        },
      });
    } catch (error) {
      caughtError = error instanceof Error ? error : new Error(String(error));
    }

    expect(escalationConditionFlag).toBe(true);
    expect(caughtError).toBeDefined();
    expect(caughtError?.message).toMatch(/信度|スコア|確信/i);
    expect(escalationNotifications).toHaveLength(1);
    expect(escalationNotifications[0]?.confidenceScore).toBe(0.35);
    expect(escalationNotifications[0]?.confidenceScore! < 0.5).toBe(true);
    expect(escalationNotifications[0]?.requiresManualReview).toBe(true);
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0]?.reason).toMatch(/信度|0\.35/);
  });

  test("should reject equal priority scores and trigger escalation", async () => {
    mockAiClient.config.shouldReturnEqualPriorityScores = true;

    let escalationConditionFlag = false;
    let caughtError: Error | null = null;

    try {
      await runTx4Imp1Agent({
        aiClient: mockAiClient,
        managerEmail: "manager@example.com",
        reportDeadline: new Date("2024-01-15T08:00:00Z"),
        onEscalation: (notification: EscalationNotification) => {
          escalationConditionFlag = true;
          escalationNotifications.push(notification);
        },
        onAuditLog: (entry: AuditLogEntry) => {
          auditLogs.push(entry);
        },
      });
    } catch (error) {
      caughtError = error instanceof Error ? error : new Error(String(error));
    }

    expect(escalationConditionFlag).toBe(true);
    expect(caughtError).toBeDefined();
    expect(caughtError?.message).toMatch(/同等|判定|困難/i);
    expect(escalationNotifications).toHaveLength(1);
    expect(escalationNotifications[0]?.errorLocation).toBe("priority_judgement");
    expect(escalationNotifications[0]?.requiresManualReview).toBe(true);
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0]?.reason).toMatch(/同等|優先度/i);
  });

  test("should include all required fields in escalation notification", async () => {
    mockAiClient.config.shouldReturnLowConfidenceScore = true;

    let escalationConditionFlag = false;

    try {
      await runTx4Imp1Agent({
        aiClient: mockAiClient,
        managerEmail: "manager@example.com",
        reportDeadline: new Date("2024-01-15T08:00:00Z"),
        onEscalation: (notification: EscalationNotification) => {
          escalationConditionFlag = true;
          escalationNotifications.push(notification);
        },
        onAuditLog: () => {
          /* no-op */
        },
      });
    } catch {
      /* expected error */
    }

    expect(escalationNotifications).toHaveLength(1);
    const notification = escalationNotifications[0]!;
    expect(notification).toHaveProperty("recipientEmail", "manager@example.com");
    expect(notification).toHaveProperty("errorLocation");
    expect(notification).toHaveProperty("confidenceScore");
    expect(notification).toHaveProperty("rejectedContent");
    expect(notification).toHaveProperty("requiresManualReview", true);
    expect(notification).toHaveProperty("timestamp");
    expect(notification.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test("should record all escalation details in audit log", async () => {
    mockAiClient.config.shouldReturnInvalidJson = true;

    try {
      await runTx4Imp1Agent({
        aiClient: mockAiClient,
        managerEmail: "manager@example.com",
        reportDeadline: new Date("2024-01-15T08:00:00Z"),
        onEscalation: () => {
          /* no-op */
        },
        onAuditLog: (entry: AuditLogEntry) => {
          auditLogs.push(entry);
        },
      });
    } catch {
      /* expected error */
    }

    expect(auditLogs).toHaveLength(1);
    const logEntry = auditLogs[0]!;
    expect(logEntry.eventType).toBe("escalation_triggered");
    expect(logEntry).toHaveProperty("reason");
    expect(logEntry).toHaveProperty("timestamp");
    expect(logEntry).toHaveProperty("rejectedOutput");
    expect(logEntry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test("should not execute subsequent report generation or distribution after escalation", async () => {
    mockAiClient.config.shouldReturnLowConfidenceScore = true;

    let reportGenerationCalled = false;
    let reportDistributionCalled = false;

    try {
      await runTx4Imp1Agent({
        aiClient: mockAiClient,
        managerEmail: "manager@example.com",
        reportDeadline: new Date("2024-01-15T08:00:00Z"),
        onEscalation: () => {
          /* no-op */
        },
        onAuditLog: () => {
          /* no-op */
        },
        onReportGenerated: () => {
          reportGenerationCalled = true;
        },
        onReportDistributed: () => {
          reportDistributionCalled = true;
        },
      });
    } catch {
      /* expected error */
    }

    expect(reportGenerationCalled).toBe(false);
    expect(reportDistributionCalled).toBe(false);
  });
});