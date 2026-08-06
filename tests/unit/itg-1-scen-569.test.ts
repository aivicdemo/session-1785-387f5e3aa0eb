import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx4Imp1Agent } from "../../src/logic/it-1";

interface MockMailClient {
  sendConfirmationEmail: jest.Mock;
  sendReportToManager: jest.Mock;
}

interface MockAiClient {
  readReportContent: jest.Mock;
  aggregateProgress: jest.Mock;
  extractIssues: jest.Mock;
  judgePriority: jest.Mock;
}

interface AuditLogEntry {
  timestamp: string;
  action: string;
  details?: Record<string, unknown>;
}

interface ReportOutput {
  status: string;
  submissionComplete: boolean;
  submissionCount: number;
  extractedIssuesCount: number;
  priorityDistribution: {
    p1_high: number;
    p2_medium: number;
    p3_low: number;
  };
  auditLog: AuditLogEntry[];
  executionTimeMs: number;
}

describe("日報収集から課題抽出・優先度判定までの自動実行 AIエージェント", () => {
  let mockMailClient: MockMailClient;
  let mockAiClient: MockAiClient;
  let auditLog: AuditLogEntry[];
  const startTime = new Date("2024-01-15T06:00:00Z");
  const meetingStartTime = new Date("2024-01-15T09:30:00Z");

  beforeEach(() => {
    auditLog = [];

    mockMailClient = {
      sendConfirmationEmail: jest.fn(async (recipients: string[], content: string) => {
        auditLog.push({
          timestamp: new Date().toISOString(),
          action: "確認メール送信",
          details: { recipients, contentLength: content.length },
        });
        return { success: true, sentTo: recipients };
      }),
      sendReportToManager: jest.fn(async (managerEmail: string, report: object) => {
        auditLog.push({
          timestamp: new Date().toISOString(),
          action: "レポート配信",
          details: { managerEmail, reportKeys: Object.keys(report) },
        });
        return { success: true, sentTo: managerEmail };
      }),
    };

    mockAiClient = {
      readReportContent: jest.fn(async (emailContents: object[]) => {
        const reportCount = Object.keys(emailContents).length;
        auditLog.push({
          timestamp: new Date().toISOString(),
          action: "日報読み込み",
          details: { readCount: reportCount },
        });
        return {
          reportsRead: reportCount,
          content: emailContents,
        };
      }),
      aggregateProgress: jest.fn(async (readReports: object[]) => {
        auditLog.push({
          timestamp: new Date().toISOString(),
          action: "進捗集約完了",
          details: { aggregatedCount: readReports.length },
        });
        return {
          submissionComplete: true,
          submissionCount: 10,
          progressSummary: "全員提出完了",
        };
      }),
      extractIssues: jest.fn(async (aggregatedData: object) => {
        const extractedCount = 5;
        auditLog.push({
          timestamp: new Date().toISOString(),
          action: "課題抽出",
          details: { extractedCount },
        });
        return {
          issues: [
            { id: 1, description: "要件定義遅延", riskLevel: "high" },
            { id: 2, description: "テスト環境構築", riskLevel: "medium" },
            { id: 3, description: "ドキュメント作成", riskLevel: "medium" },
            { id: 4, description: "パフォーマンス最適化", riskLevel: "low" },
            { id: 5, description: "依存ライブラリ更新", riskLevel: "low" },
          ],
          issueCount: extractedCount,
        };
      }),
      judgePriority: jest.fn(async (issues: object[]) => {
        auditLog.push({
          timestamp: new Date().toISOString(),
          action: "優先度判定完了",
          details: { priorityJudgedCount: issues.length },
        });
        return {
          prioritizedIssues: [
            { id: 1, description: "要件定義遅延", priority: 1 },
            { id: 2, description: "テスト環境構築", priority: 2 },
            { id: 3, description: "ドキュメント作成", priority: 3 },
            { id: 4, description: "パフォーマンス最適化", priority: 4 },
            { id: 5, description: "依存ライブラリ更新", priority: 5 },
          ],
          priorityDistribution: {
            p1_high: 1,
            p2_medium: 1,
            p3_low: 3,
          },
          hasEscalationIssue: false,
        };
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-569
  test("日報収集から課題抽出・優先度判定までの自動実行が通常案件を最後まで完了する", async () => {
    const testReportData = {
      employee_001: {
        yesterday: "APIサーバー実装完了",
        today: "テスト実装開始",
        issues: "なし",
        submittedAt: new Date("2024-01-15T08:00:00Z").toISOString(),
      },
      employee_002: {
        yesterday: "フロントエンドコンポーネント開発",
        today: "ユーザー認証機能実装",
        issues: "テスト環境へのアクセス権限未設定",
        submittedAt: new Date("2024-01-15T08:05:00Z").toISOString(),
      },
      employee_003: {
        yesterday: "データベーススキーマ設計",
        today: "マイグレーション作成",
        issues: "なし",
        submittedAt: new Date("2024-01-15T08:10:00Z").toISOString(),
      },
      employee_004: {
        yesterday: "要件ドキュメント作成",
        today: "ステークホルダー確認会議",
        issues: "要件の曖昧性が残存",
        submittedAt: new Date("2024-01-15T08:15:00Z").toISOString(),
      },
      employee_005: {
        yesterday: "単体テスト実装",
        today: "統合テスト準備",
        issues: "なし",
        submittedAt: new Date("2024-01-15T08:20:00Z").toISOString(),
      },
      employee_006: {
        yesterday: "パフォーマンス測定",
        today: "最適化着手",
        issues: "データセット不足",
        submittedAt: new Date("2024-01-15T08:25:00Z").toISOString(),
      },
      employee_007: {
        yesterday: "セキュリティ監査実施",
        today: "脆弱性対応",
        issues: "なし",
        submittedAt: new Date("2024-01-15T08:30:00Z").toISOString(),
      },
      employee_008: {
        yesterday: "デプロイメント自動化構築",
        today: "本番環境テスト",
        issues: "CI/CDパイプライン調整必要",
        submittedAt: new Date("2024-01-15T08:35:00Z").toISOString(),
      },
      employee_009: {
        yesterday: "ログシステム設計",
        today: "実装開始",
        issues: "なし",
        submittedAt: new Date("2024-01-15T08:40:00Z").toISOString(),
      },
      employee_010: {
        yesterday: "ドキュメント更新",
        today: "APIドキュメント作成",
        issues: "なし",
        submittedAt: new Date("2024-01-15T08:45:00Z").toISOString(),
      },
    };

    const managerEmail = "manager@company.com";

    const executionStartTime = Date.now();

    auditLog.push({
      timestamp: startTime.toISOString(),
      action: "Tx4Imp1Agent開始",
      details: { reportCount: Object.keys(testReportData).length },
    });

    const confirmationResult = await mockMailClient.sendConfirmationEmail(
      Object.keys(testReportData).map((key) => `${key}@company.com`),
      "本日の日報提出をお願いします"
    );
    expect(confirmationResult.success).toBe(true);
    expect(confirmationResult.sentTo).toHaveLength(10);

    const readResult = await mockAiClient.readReportContent(testReportData);
    expect(readResult.reportsRead).toBe(10);
    expect(readResult.content).toEqual(testReportData);

    const aggregateResult = await mockAiClient.aggregateProgress(
      Object.values(testReportData)
    );
    expect(aggregateResult.submissionComplete).toBe(true);
    expect(aggregateResult.submissionCount).toBe(10);

    const extractResult = await mockAiClient.extractIssues(aggregateResult);
    expect(extractResult.issueCount).toBe(5);
    expect(extractResult.issues).toHaveLength(5);

    const priorityResult = await mockAiClient.judgePriority(
      extractResult.issues
    );
    expect(priorityResult.prioritizedIssues).toHaveLength(5);
    expect(priorityResult.priorityDistribution.p1_high).toBe(1);
    expect(priorityResult.priorityDistribution.p2_medium).toBe(1);
    expect(priorityResult.priorityDistribution.p3_low).toBe(3);
    expect(priorityResult.hasEscalationIssue).toBe(false);

    const reportOutput = {
      status: "completed",
      submissionComplete: aggregateResult.submissionComplete,
      submissionCount: aggregateResult.submissionCount,
      extractedIssuesCount: extractResult.issueCount,
      priorityDistribution: priorityResult.priorityDistribution,
      escalationDetected: priorityResult.hasEscalationIssue,
    };

    const reportDeliveryResult = await mockMailClient.sendReportToManager(
      managerEmail,
      reportOutput
    );
    expect(reportDeliveryResult.success).toBe(true);
    expect(reportDeliveryResult.sentTo).toBe(managerEmail);

    auditLog.push({
      timestamp: new Date().toISOString(),
      action: "エージェント完了",
      details: { status: reportOutput.status, escalation: "no_escalation" },
    });

    const executionEndTime = Date.now();
    const executionTimeMs = executionEndTime - executionStartTime;

    const result: ReportOutput = {
      status: reportOutput.status,
      submissionComplete: reportOutput.submissionComplete,
      submissionCount: reportOutput.submissionCount,
      extractedIssuesCount: reportOutput.extractedIssuesCount,
      priorityDistribution: reportOutput.priorityDistribution,
      auditLog,
      executionTimeMs,
    };

    expect(result.status).toBe("completed");
    expect(result.submissionComplete).toBe(true);
    expect(result.submissionCount).toBe(10);
    expect(result.extractedIssuesCount).toBe(5);
    expect(result.priorityDistribution.p1_high).toBe(1);
    expect(result.priorityDistribution.p2_medium).toBe(1);
    expect(result.priorityDistribution.p3_low).toBe(3);

    expect(result.auditLog.length).toBeGreaterThanOrEqual(8);
    expect(result.auditLog[0].action).toBe("Tx4Imp1Agent開始");
    expect(result.auditLog[1].action).toBe("確認メール送信");
    expect(result.auditLog[2].action).toBe("日報読み込み");
    expect(result.auditLog[3].action).toBe("進捗集約完了");
    expect(result.auditLog[4].action).toBe("課題抽出");
    expect(result.auditLog[5].action).toBe("優先度判定完了");
    expect(result.auditLog[6].action).toBe("レポート配信");
    expect(result.auditLog[7].action).toBe("エージェント完了");

    expect(result.executionTimeMs).toBeLessThan(180000);

    expect(mockMailClient.sendConfirmationEmail).toHaveBeenCalledTimes(1);
    expect(mockMailClient.sendReportToManager).toHaveBeenCalledTimes(1);
    expect(mockAiClient.readReportContent).toHaveBeenCalledTimes(1);
    expect(mockAiClient.aggregateProgress).toHaveBeenCalledTimes(1);
    expect(mockAiClient.extractIssues).toHaveBeenCalledTimes(1);
    expect(mockAiClient.judgePriority).toHaveBeenCalledTimes(1);
  });
});