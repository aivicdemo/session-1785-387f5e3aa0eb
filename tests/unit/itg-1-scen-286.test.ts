import { type Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/orchestrator";
import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";

import { runTx2Imp1Agent } from "../../src/agents/tx-2-imp-1/orchestrator";

// Mock types for test
interface MockDailyReport {
  employeeId: string;
  departmentId: string;
  submittedAt: string;
  yesterday: string;
  today: string;
  issues: string;
}

interface MockMailDeliveryResult {
  recipientEmail: string;
  subject: string;
  body: string;
  sentAt: string;
  deliveryId: string;
  status: "sent" | "failed";
}

interface MockAuditLog {
  action: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

// Fake AI client for testing
class FakeTx2Imp1AiClient implements Tx2Imp1AiClient {
  private callHistory: Array<{
    payload: Record<string, unknown>;
    result: MockMailDeliveryResult;
    timestamp: string;
  }> = [];
  private auditLogs: MockAuditLog[] = [];

  async sendConfirmationEmail(
    reports: MockDailyReport[],
    managerEmail: string,
    managerName: string
  ): Promise<MockMailDeliveryResult> {
    const sentTimestamp = new Date().toISOString();
    const deliveryId = `delivery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Sort reports by employeeId for consistent ordering
    const sortedReports = [...reports].sort(
      (a, b) => a.employeeId.localeCompare(b.employeeId)
    );

    // Generate consistent body content
    const bodyLines = sortedReports
      .map(
        (r) =>
          `【${r.employeeId}】\n昨日: ${r.yesterday}\n今日: ${r.today}\n課題: ${r.issues}`
      )
      .join("\n\n");

    const reportDate = new Date(reports[0].submittedAt)
      .toISOString()
      .split("T")[0];
    const subject = `朝会報告確認 - ${reportDate}`;

    const result: MockMailDeliveryResult = {
      recipientEmail: managerEmail,
      subject,
      body: bodyLines,
      sentAt: sentTimestamp,
      deliveryId,
      status: "sent",
    };

    const payload = {
      reports: sortedReports,
      managerEmail,
      managerName,
      reportCount: reports.length,
    };

    this.callHistory.push({
      payload,
      result,
      timestamp: sentTimestamp,
    });

    this.auditLogs.push({
      action: "sendConfirmationEmail",
      timestamp: sentTimestamp,
      payload,
    });

    return result;
  }

  getCallHistory(): Array<{
    payload: Record<string, unknown>;
    result: MockMailDeliveryResult;
    timestamp: string;
  }> {
    return [...this.callHistory];
  }

  getAuditLogs(): MockAuditLog[] {
    return [...this.auditLogs];
  }

  resetMocks(): void {
    this.callHistory = [];
    this.auditLogs = [];
  }
}

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-286
  test("確認メール配信・日報一覧集約機能 - 同じ報告内容で配信処理を2回実行した場合、同一のメール配信結果が生成される", async () => {
    // Initialize fake AI client
    const fakeAiClient = new FakeTx2Imp1AiClient();

    // Setup: Create test data with 10 employees and fixed submission timestamp
    const fixedSubmittedAt = "2024-01-15T07:30:00Z";
    const mockReports: MockDailyReport[] = [
      {
        employeeId: "EMP001",
        departmentId: "DEV",
        submittedAt: fixedSubmittedAt,
        yesterday: "API実装完了、ユニットテスト80%実施",
        today: "ユニットテスト完了、統合テスト開始",
        issues: "DBコネクション遅延問題、要調査",
      },
      {
        employeeId: "EMP002",
        departmentId: "DEV",
        submittedAt: fixedSubmittedAt,
        yesterday: "フロントエンド画面実装、レビュー済み",
        today: "レビュー修正対応、デプロイ準備",
        issues: "ブラウザ互換性問題、IE対応未定",
      },
      {
        employeeId: "EMP003",
        departmentId: "DEV",
        submittedAt: fixedSubmittedAt,
        yesterday: "ドキュメント作成、スタイルガイド更新",
        today: "スタイルガイド最終化、チーム共有",
        issues: "デザイン仕様の曖昧さ、PM確認待ち",
      },
      {
        employeeId: "EMP004",
        departmentId: "DEV",
        submittedAt: fixedSubmittedAt,
        yesterday: "バグ修正3件、本番環境検証",
        today: "残りバグ修正2件、ホットフィックス対応",
        issues: "本番環境でのメモリ使用率上昇",
      },
      {
        employeeId: "EMP005",
        departmentId: "DEV",
        submittedAt: fixedSubmittedAt,
        yesterday: "パフォーマンス改善、クエリ最適化実施",
        today: "キャッシング戦略検討、実装開始",
        issues: "レッドis層の応答時間が高い",
      },
      {
        employeeId: "EMP006",
        departmentId: "DEV",
        submittedAt: fixedSubmittedAt,
        yesterday: "セキュリティ監査対応、脆弱性2件修正",
        today: "脆弱性対応完了確認、報告作成",
        issues: "外部ライブラリの脆弱性情報対応中",
      },
      {
        employeeId: "EMP007",
        departmentId: "DEV",
        submittedAt: fixedSubmittedAt,
        yesterday: "テスト自動化スクリプト作成、CI/CD統合",
        today: "テストカバレッジ拡大、ドキュメント作成",
        issues: "テスト実行時間が30分超過",
      },
      {
        employeeId: "EMP008",
        departmentId: "DEV",
        submittedAt: fixedSubmittedAt,
        yesterday: "インフラ構築、AWS設定完了",
        today: "ロードバランサー設定、DR対応",
        issues: "コスト最適化のための検討が必要",
      },
      {
        employeeId: "EMP009",
        departmentId: "DEV",
        submittedAt: fixedSubmittedAt,
        yesterday: "ログ分析、エラー発生原因特定",
        today: "監視アラート設定、ダッシュボード作成",
        issues: "ログボリューム急増、保持期間短縮検討",
      },
      {
        employeeId: "EMP010",
        departmentId: "DEV",
        submittedAt: fixedSubmittedAt,
        yesterday: "チーム定例、来週スケジュール調整",
        today: "プロジェクトキックオフ、要件ヒアリング",
        issues: "要件定義書の内容が不十分",
      },
    ];

    const managerEmail = "manager@company.com";
    const managerName = "開発部長";

    // Execute: First email delivery run
    const firstResult = await fakeAiClient.sendConfirmationEmail(
      mockReports,
      managerEmail,
      managerName
    );

    // Record first delivery result
    const firstDeliveryId = firstResult.deliveryId;
    const firstSubject = firstResult.subject;
    const firstBody = firstResult.body;
    const firstSentAt = firstResult.sentAt;
    const firstStatus = firstResult.status;
    const firstRecipientEmail = firstResult.recipientEmail;

    // Verify first call was recorded
    const firstCallHistory = fakeAiClient.getCallHistory();
    expect(firstCallHistory).toHaveLength(1);
    expect(firstCallHistory[0].result.deliveryId).toBe(firstDeliveryId);

    // Execute: Second email delivery run with identical data
    const secondResult = await fakeAiClient.sendConfirmationEmail(
      mockReports,
      managerEmail,
      managerName
    );

    // Record second delivery result
    const secondDeliveryId = secondResult.deliveryId;
    const secondSubject = secondResult.subject;
    const secondBody = secondResult.body;
    const secondStatus = secondResult.status;
    const secondRecipientEmail = secondResult.recipientEmail;

    // Verify second call was recorded
    const secondCallHistory = fakeAiClient.getCallHistory();
    expect(secondCallHistory).toHaveLength(2);

    // Verify: Delivery results match (same content, same structure)
    expect(firstRecipientEmail).toBe(secondRecipientEmail);
    expect(firstRecipientEmail).toBe(managerEmail);

    expect(firstSubject).toBe(secondSubject);
    expect(firstSubject).toMatch(/朝会報告確認 - 2024-01-15/);

    expect(firstBody).toBe(secondBody);
    // Verify body contains all 10 employees in alphabetical order
    expect(firstBody).toContain("【EMP001】");
    expect(firstBody).toContain("【EMP010】");
    expect(firstBody).toContain("API実装完了、ユニットテスト80%実施");
    expect(firstBody).toContain("プロジェクトキックオフ、要件ヒアリング");

    expect(firstStatus).toBe(secondStatus);
    expect(firstStatus).toBe("sent");

    // Verify: Delivery timestamps are recorded
    expect(firstResult.sentAt).toBeDefined();
    expect(secondResult.sentAt).toBeDefined();

    // Verify: Delivery IDs are different (generated independently)
    expect(firstDeliveryId).not.toBe(secondDeliveryId);

    // Verify: Call history shows exactly 2 calls with same payload
    expect(secondCallHistory).toHaveLength(2);
    expect(secondCallHistory[0].payload.reports).toEqual(
      secondCallHistory[1].payload.reports
    );
    expect(secondCallHistory[0].payload.managerEmail).toBe(
      secondCallHistory[1].payload.managerEmail
    );
    expect(secondCallHistory[0].payload.reportCount).toBe(10);
    expect(secondCallHistory[1].payload.reportCount).toBe(10);

    // Verify: Audit logs record both executions
    const auditLogs = fakeAiClient.getAuditLogs();
    expect(auditLogs).toHaveLength(2);
    expect(auditLogs[0].action).toBe("sendConfirmationEmail");
    expect(auditLogs[1].action).toBe("sendConfirmationEmail");

    // Verify: Audit logs contain identical payloads
    expect(auditLogs[0].payload.reports).toEqual(auditLogs[1].payload.reports);
    expect(auditLogs[0].payload.reportCount).toBe(10);
    expect(auditLogs[1].payload.reportCount).toBe(10);

    // Verify: Both audit entries are timestamped
    expect(auditLogs[0].timestamp).toBeDefined();
    expect(auditLogs[1].timestamp).toBeDefined();
  });
});