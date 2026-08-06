import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import type { Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/interfaces';
import { sendConfirmationEmailsWithAggregation } from '../../src/logic/it-1-br-1-1-1';

// Mock types
interface MockDailyReport {
  user_id: string;
  yesterday_achievement: string;
  today_plan: string;
  issues: string;
  submission_status: string;
  submitted_at: string;
}

interface MockEmailLog {
  recipient_id: string;
  subject: string;
  body: string;
  status: string;
  sent_at: string;
}

interface MockAgentResult {
  unsent_users: string[];
  delayed_users: string[];
  submitted_count: number;
  all_reports: MockDailyReport[];
}

// Stub AI client
class StubTx2Imp1AiClient implements Tx2Imp1AiClient {
  async analyzeSubmissionStatus(reports: MockDailyReport[]): Promise<MockAgentResult> {
    const submitted = reports.filter(r => r.submission_status === 'submitted');
    return {
      unsent_users: [],
      delayed_users: [],
      submitted_count: submitted.length,
      all_reports: submitted
    };
  }

  async generateAggregatedEmailBody(reports: MockDailyReport[], count: number): Promise<string> {
    const reportLines = reports.map(r => 
      `【${r.user_id}】\n` +
      `昨日やったこと: ${r.yesterday_achievement}\n` +
      `今日やること: ${r.today_plan}\n` +
      `抱えている課題: ${r.issues}`
    ).join('\n\n');
    
    return `日報集約レポート（送信済み: ${count}名）\n\n${reportLines}`;
  }
}

describe('確認メール配信・日報一覧集約機能', () => {
  // SCEN-312
  test('送信済み部員数が11名（10名超過）の時、確認メールに11名分の日報が集約される', async () => {
    const aiClient = new StubTx2Imp1AiClient();
    const managerUserId = 'manager_001';
    const reportSubmissionTime = new Date('2024-01-15T08:30:00Z').toISOString();
    const emailSentTime = new Date('2024-01-15T08:35:00Z').toISOString();

    // Prepare 11 daily reports with different content for each user
    const reports: MockDailyReport[] = [
      {
        user_id: 'user_001',
        yesterday_achievement: 'ユーザー001：昨日はAPI実装を完了した',
        today_plan: 'ユーザー001：本日はテスト実装を開始する',
        issues: 'ユーザー001：データベース接続の遅延に対応中',
        submission_status: 'submitted',
        submitted_at: reportSubmissionTime
      },
      {
        user_id: 'user_002',
        yesterday_achievement: 'ユーザー002：フロントエンド画面の改修を行った',
        today_plan: 'ユーザー002：バグ修正を継続する',
        issues: 'ユーザー002：デザイン変更の要件が未確定',
        submission_status: 'submitted',
        submitted_at: reportSubmissionTime
      },
      {
        user_id: 'user_003',
        yesterday_achievement: 'ユーザー003：ドキュメント作成を進めた',
        today_plan: 'ユーザー003：レビュー対応を実施する',
        issues: 'ユーザー003：外部ライブラリの互換性問題',
        submission_status: 'submitted',
        submitted_at: reportSubmissionTime
      },
      {
        user_id: 'user_004',
        yesterday_achievement: 'ユーザー004：パフォーマンス測定を完了した',
        today_plan: 'ユーザー004：最適化実装を開始する',
        issues: 'ユーザー004：サーバーリソース不足の警告',
        submission_status: 'submitted',
        submitted_at: reportSubmissionTime
      },
      {
        user_id: 'user_005',
        yesterday_achievement: 'ユーザー005：セキュリティ監査を実施した',
        today_plan: 'ユーザー005：脆弱性対応を進める',
        issues: 'ユーザー005：暗号化キー管理の確認が必要',
        submission_status: 'submitted',
        submitted_at: reportSubmissionTime
      },
      {
        user_id: 'user_006',
        yesterday_achievement: 'ユーザー006：デプロイ作業を完了した',
        today_plan: 'ユーザー006：本番環境検証を実施する',
        issues: 'ユーザー006：ログ出力の不具合報告あり',
        submission_status: 'submitted',
        submitted_at: reportSubmissionTime
      },
      {
        user_id: 'user_007',
        yesterday_achievement: 'ユーザー007：ユーザー研修資料を作成した',
        today_plan: 'ユーザー007：導入トレーニングを実施する',
        issues: 'ユーザー007：ユーザーフィードバック対応中',
        submission_status: 'submitted',
        submitted_at: reportSubmissionTime
      },
      {
        user_id: 'user_008',
        yesterday_achievement: 'ユーザー008：インフラ構築を進めた',
        today_plan: 'ユーザー008：ネットワーク設定を完了する',
        issues: 'ユーザー008：ファイアウォールルール調整が遅延中',
        submission_status: 'submitted',
        submitted_at: reportSubmissionTime
      },
      {
        user_id: 'user_009',
        yesterday_achievement: 'ユーザー009：統合テストを実施した',
        today_plan: 'ユーザー009：本番テストを開始する',
        issues: 'ユーザー009：テスト環境の不安定性が課題',
        submission_status: 'submitted',
        submitted_at: reportSubmissionTime
      },
      {
        user_id: 'user_010',
        yesterday_achievement: 'ユーザー010：コードレビューを完了した',
        today_plan: 'ユーザー010：マージ作業を進める',
        issues: 'ユーザー010：コンフリクト解決が必要',
        submission_status: 'submitted',
        submitted_at: reportSubmissionTime
      },
      {
        user_id: 'user_011',
        yesterday_achievement: 'ユーザー011：機能開発を完了した',
        today_plan: 'ユーザー011：追加機能実装に移行する',
        issues: 'ユーザー011：要件変更の再説明が必要',
        submission_status: 'submitted',
        submitted_at: reportSubmissionTime
      }
    ];

    // Execute agent analysis
    const agentResult = await aiClient.analyzeSubmissionStatus(reports);

    // Verify agent recognized all 11 reports
    expect(agentResult.submitted_count).toBe(11);
    expect(agentResult.all_reports.length).toBe(11);
    expect(agentResult.unsent_users.length).toBe(0);

    // Verify all user IDs are present
    const userIds = agentResult.all_reports.map(r => r.user_id);
    expect(userIds).toContain('user_001');
    expect(userIds).toContain('user_002');
    expect(userIds).toContain('user_003');
    expect(userIds).toContain('user_004');
    expect(userIds).toContain('user_005');
    expect(userIds).toContain('user_006');
    expect(userIds).toContain('user_007');
    expect(userIds).toContain('user_008');
    expect(userIds).toContain('user_009');
    expect(userIds).toContain('user_010');
    expect(userIds).toContain('user_011');

    // Generate aggregated email body
    const emailBody = await aiClient.generateAggregatedEmailBody(agentResult.all_reports, agentResult.submitted_count);

    // Verify email body contains all 11 reports
    expect(emailBody).toContain('日報集約レポート（送信済み: 11名）');
    expect(emailBody).toContain('【user_001】');
    expect(emailBody).toContain('【user_011】');

    // Verify each report has all 3 required items
    reports.forEach((report, index) => {
      const reportContent = agentResult.all_reports[index];
      expect(emailBody).toContain(reportContent.yesterday_achievement);
      expect(emailBody).toContain(reportContent.today_plan);
      expect(emailBody).toContain(reportContent.issues);
      expect(emailBody).toContain('昨日やったこと:');
      expect(emailBody).toContain('今日やること:');
      expect(emailBody).toContain('抱えている課題:');
    });

    // Call logic function to send confirmation emails
    const emailLogs: MockEmailLog[] = [];
    const mockSendEmail = jest.fn(async (recipientId: string, subject: string, body: string) => {
      emailLogs.push({
        recipient_id: recipientId,
        subject: subject,
        body: body,
        status: 'sent',
        sent_at: emailSentTime
      });
      return { success: true, sent_at: emailSentTime };
    });

    // Execute sendConfirmationEmailsWithAggregation with mocked dependencies
    const result = await sendConfirmationEmailsWithAggregation(
      {
        manager_user_id: managerUserId,
        all_reports: agentResult.all_reports,
        submitted_count: agentResult.submitted_count,
        email_subject: 'ユーザー日報確認メール',
        email_body: emailBody
      },
      { sendEmail: mockSendEmail }
    );

    // Verify email was sent to manager
    expect(mockSendEmail).toHaveBeenCalledWith(
      managerUserId,
      expect.stringContaining('ユーザー日報確認メール'),
      expect.stringContaining('日報集約レポート（送信済み: 11名）')
    );

    // Verify email log records
    expect(emailLogs.length).toBe(1);
    expect(emailLogs[0].recipient_id).toBe(managerUserId);
    expect(emailLogs[0].status).toBe('sent');
    expect(emailLogs[0].body).toContain('【user_001】');
    expect(emailLogs[0].body).toContain('【user_011】');

    // Verify result status
    expect(result.success).toBe(true);
    expect(result.delivered_count).toBe(1);
    expect(result.aggregated_report_count).toBe(11);
  });
});