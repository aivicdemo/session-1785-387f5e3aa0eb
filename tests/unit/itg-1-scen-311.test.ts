import { type Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/orchestrator";
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

import { aggregateDailyReportsForConfirmationEmail } from '../../src/logic/it-1-br-1-1-1';

const fetchMock = require('jest-fetch-mock');

describe('確認メール配信・日報一覧集約機能', () => {
  let aiClientStub: Tx2Imp1AiClient;
  let auditLogEntries: Array<{ timestamp: string; event: string; details: string }>;

  beforeEach(() => {
    fetchMock.resetMocks();
    auditLogEntries = [];

    aiClientStub = {
      checkDailyReportSubmissionStatus: jest.fn(async (params) => {
        return {
          totalEmployees: params.totalEmployees,
          submittedCount: params.submittedReports.length,
          notSubmittedCount: params.totalEmployees - params.submittedReports.length,
          submittedReports: params.submittedReports,
        };
      }),
      generateConfirmationEmailPayload: jest.fn(async (params) => {
        const aggregatedReports = params.submittedReports.map((report: any) => ({
          employeeId: report.employeeId,
          employeeName: report.employeeName,
          departmentId: report.departmentId,
          yesterday: report.yesterday,
          today: report.today,
          issues: report.issues,
          submittedAt: report.submittedAt,
        }));

        return {
          recipientManagerId: params.managerUserId,
          aggregatedReportsCount: aggregatedReports.length,
          reports: aggregatedReports,
          generatedAt: new Date('2024-01-15T09:30:00Z').toISOString(),
        };
      }),
      sendConfirmationEmail: jest.fn(async (params) => {
        return {
          sent: true,
          messageId: 'msg-' + Date.now(),
          recipientCount: 2,
          sentAt: new Date('2024-01-15T09:31:00Z').toISOString(),
        };
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-311
  test('送信済み部員数が9名の時、確認メールに9名分の日報が集約される', async () => {
    const testDate = '2024-01-15';
    const totalEmployees = 10;
    const submittedCount = 9;

    const submittedReports = [
      {
        employeeId: 'EMP001',
        employeeName: '山田太郎',
        departmentId: 'DEPT001',
        yesterday: '前日のタスクA、タスクBを完了',
        today: '本日はタスクCとタスクDに取り組む予定',
        issues: '外部APIの遅延が懸念される',
        submittedAt: new Date('2024-01-15T07:45:00Z').toISOString(),
      },
      {
        employeeId: 'EMP002',
        employeeName: '鈴木花子',
        departmentId: 'DEPT001',
        yesterday: 'コードレビュー3件、バグ修正1件',
        today: 'テスト環境でのテスト実行、本番環境へのデプロイ準備',
        issues: '要件の曖昧な部分がある',
        submittedAt: new Date('2024-01-15T07:50:00Z').toISOString(),
      },
      {
        employeeId: 'EMP003',
        employeeName: '佐藤次郎',
        departmentId: 'DEPT002',
        yesterday: 'データベース設計、スキーマ作成',
        today: 'テーブル最適化、インデックス作成',
        issues: 'パフォーマンス改善の優先度決定が必要',
        submittedAt: new Date('2024-01-15T08:00:00Z').toISOString(),
      },
      {
        employeeId: 'EMP004',
        employeeName: '高橋美咲',
        departmentId: 'DEPT002',
        yesterday: 'フロントエンドコンポーネントの実装',
        today: 'ユーザーテスト対応、UIの調整',
        issues: 'ブラウザ互換性の問題がある',
        submittedAt: new Date('2024-01-15T08:05:00Z').toISOString(),
      },
      {
        employeeId: 'EMP005',
        employeeName: '伊藤拓也',
        departmentId: 'DEPT001',
        yesterday: 'インフラの監視ツール設定',
        today: 'ログ解析、アラート設定の改善',
        issues: 'クラウドコスト削減の検討が必要',
        submittedAt: new Date('2024-01-15T08:10:00Z').toISOString(),
      },
      {
        employeeId: 'EMP006',
        employeeName: '中村由美',
        departmentId: 'DEPT003',
        yesterday: 'テスト計画策定、テストケース作成',
        today: '機能テスト実行、バグ報告書作成',
        issues: 'テスト環境の安定性が低い',
        submittedAt: new Date('2024-01-15T08:15:00Z').toISOString(),
      },
      {
        employeeId: 'EMP007',
        employeeName: '石田健一',
        departmentId: 'DEPT001',
        yesterday: 'APIドキュメント作成、エンドポイント設計',
        today: 'エラーハンドリング実装、テスト実装',
        issues: '要件変更対応の影響範囲が不明確',
        submittedAt: new Date('2024-01-15T08:20:00Z').toISOString(),
      },
      {
        employeeId: 'EMP008',
        employeeName: '福山沙希',
        departmentId: 'DEPT002',
        yesterday: 'セキュリティ診断レポート作成',
        today: '脆弱性修正対応、パッチ検証',
        issues: 'セキュリティ施策の優先順位を決める必要がある',
        submittedAt: new Date('2024-01-15T08:25:00Z').toISOString(),
      },
      {
        employeeId: 'EMP009',
        employeeName: '渡辺翔太',
        departmentId: 'DEPT003',
        yesterday: 'ドキュメント作成、リリースノート記載',
        today: 'ユーザー向け説明資料作成、サポート準備',
        issues: 'ローカライズ対応の工数見積もりが不確実',
        submittedAt: new Date('2024-01-15T08:30:00Z').toISOString(),
      },
    ];

    const managerUserId = 'MGR001';
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');

    const result = await aggregateDailyReportsForConfirmationEmail({
      date: testDate,
      managerUserId: managerUserId,
      totalEmployees: totalEmployees,
      submittedReports: submittedReports,
      morningMeetingStartTime: morningMeetingStartTime,
      aiClient: aiClientStub,
      auditLog: {
        record: (event: string, details: string) => {
          auditLogEntries.push({
            timestamp: new Date('2024-01-15T09:31:00Z').toISOString(),
            event: event,
            details: details,
          });
        },
      },
    });

    expect(result.aggregatedReportsCount).toBe(9);
    expect(result.aggregatedReports).toHaveLength(9);

    result.aggregatedReports.forEach((report: any, index: number) => {
      expect(report).toHaveProperty('employeeId');
      expect(report).toHaveProperty('employeeName');
      expect(report).toHaveProperty('departmentId');
      expect(report).toHaveProperty('yesterday');
      expect(report).toHaveProperty('today');
      expect(report).toHaveProperty('issues');
      expect(report).toHaveProperty('submittedAt');

      expect(typeof report.yesterday).toBe('string');
      expect(typeof report.today).toBe('string');
      expect(typeof report.issues).toBe('string');
      expect(report.yesterday.length).toBeGreaterThan(0);
      expect(report.today.length).toBeGreaterThan(0);
      expect(report.issues.length).toBeGreaterThan(0);
    });

    const submittedEmployeeIds = submittedReports.map((r: any) => r.employeeId);
    const aggregatedEmployeeIds = result.aggregatedReports.map((r: any) => r.employeeId);

    expect(aggregatedEmployeeIds).toEqual(submittedEmployeeIds);
    expect(aggregatedEmployeeIds).not.toContain('EMP010');

    expect(result.confirmationEmailSent).toBe(true);
    expect(result.confirmationEmailMessageId).toBeDefined();
    expect(typeof result.confirmationEmailMessageId).toBe('string');

    const auditLogEntry = auditLogEntries.find((entry: any) =>
      entry.event.includes('日報集約処理完了') || entry.details.includes('9')
    );
    expect(auditLogEntry).toBeDefined();
    expect(auditLogEntry?.details).toMatch(/9件/);

    expect(aiClientStub.checkDailyReportSubmissionStatus).toHaveBeenCalled();
    expect(aiClientStub.generateConfirmationEmailPayload).toHaveBeenCalled();
    expect(aiClientStub.sendConfirmationEmail).toHaveBeenCalled();
  });
});