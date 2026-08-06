import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import type { Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/types';
import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';

const fetchMock = require('jest-fetch-mock');
fetchMock.enableMocks();

describe('朝会報告管理システム - 日報入力フォームの提供と送信機能', () => {
  let mockAiClient: Tx2Imp1AiClient;
  let sentEmails: Array<{ to: string; subject: string; body: string }>;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchMock.resetMocks();
    sentEmails = [];
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    // 送信済み部員1名、未提出部員9名と判定するスタブAIクライアント
    mockAiClient = {
      analyzeReportStatus: jest.fn().mockResolvedValue({
        submitted_count: 1,
        not_submitted_count: 9,
        submitted_members: [
          {
            email: 'tanaka@example.com',
            name: 'tanaka',
            yesterday_achievement: 'レビュー完了',
            today_plan: 'テスト実施',
            current_issues: 'なし',
            submitted_at: '2024-01-15T08:30:00Z',
          },
        ],
        not_submitted_members: [
          { email: 'user2@example.com', name: 'user2' },
          { email: 'user3@example.com', name: 'user3' },
          { email: 'user4@example.com', name: 'user4' },
          { email: 'user5@example.com', name: 'user5' },
          { email: 'user6@example.com', name: 'user6' },
          { email: 'user7@example.com', name: 'user7' },
          { email: 'user8@example.com', name: 'user8' },
          { email: 'user9@example.com', name: 'user9' },
          { email: 'user10@example.com', name: 'user10' },
        ],
      }),
      generateAggregateReport: jest.fn().mockResolvedValue({
        subject: '朝会報告集約 [送信済み: 1名 / 未提出: 9名]',
        formatted_reports: [
          'tanaka@example.com: 昨日やったこと=レビュー完了 / 今日やること=テスト実施 / 抱えている課題=なし',
        ],
      }),
    };

    // メール送信をスタブ化
    fetchMock.mockResponseOnce(JSON.stringify({ success: true }), {
      status: 200,
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  // SCEN-280: [normal] 確認メール配信・日報一覧集約機能 - 送信済み部員1名の場合、その日報が統一フォーマットで部長宛メールに含まれる
  test('SCEN-280: 送信済み部員1名の日報が統一フォーマットで部長宛メールに含まれる', async () => {
    // テスト用パラメータ設定
    const manager_email = 'bucho@example.com';
    const report_deadline_time = '2024-01-15T09:00:00Z';
    const current_time = '2024-01-15T09:15:00Z';

    const input_params = {
      manager_email,
      report_deadline_time,
      current_time,
      ai_client: mockAiClient,
      send_email_fn: async (to: string, subject: string, body: string) => {
        sentEmails.push({ to, subject, body });
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, subject, body }),
        });
        return response.ok;
      },
    };

    // AIエージェント実行
    const result = await runTx2Imp1Agent(input_params);

    // 期待値: メール送信が1件実行された
    expect(sentEmails).toHaveLength(1);

    // 期待値: メール送信先は部長のメールアドレス
    const sent_email = sentEmails[0];
    expect(sent_email.to).toBe('bucho@example.com');

    // 期待値: メール件名に送信済み・未提出人数が含まれる
    expect(sent_email.subject).toMatch(/朝会報告集約/);
    expect(sent_email.subject).toMatch(/送信済み: 1名/);
    expect(sent_email.subject).toMatch(/未提出: 9名/);

    // 期待値: メール本文に統一フォーマットで送信済み部員情報が含まれる
    const body_line_count = sent_email.body
      .split('\n')
      .filter((line: string) => line.match(/tanaka@example\.com/)).length;
    expect(body_line_count).toBeGreaterThan(0);

    expect(sent_email.body).toMatch(/tanaka@example\.com/);
    expect(sent_email.body).toMatch(/昨日やったこと=レビュー完了/);
    expect(sent_email.body).toMatch(/今日やること=テスト実施/);
    expect(sent_email.body).toMatch(/抱えている課題=なし/);

    // 期待値: メール本文に未提出部員セクションが含まれる
    expect(sent_email.body).toMatch(/未提出/);

    // 期待値: AIクライアントが正確に送信状況を判定した
    expect(mockAiClient.analyzeReportStatus).toHaveBeenCalled();
    const ai_analysis_result = await mockAiClient.analyzeReportStatus();
    expect(ai_analysis_result.submitted_count).toBe(1);
    expect(ai_analysis_result.not_submitted_count).toBe(9);
    expect(ai_analysis_result.submitted_members).toHaveLength(1);
    expect(ai_analysis_result.submitted_members[0].email).toBe(
      'tanaka@example.com'
    );
    expect(
      ai_analysis_result.submitted_members[0].yesterday_achievement
    ).toBe('レビュー完了');
    expect(ai_analysis_result.submitted_members[0].today_plan).toBe(
      'テスト実施'
    );
    expect(ai_analysis_result.submitted_members[0].current_issues).toBe('なし');

    // 期待値: レポート集約が正確に生成された
    expect(mockAiClient.generateAggregateReport).toHaveBeenCalled();
    const aggregate_report = await mockAiClient.generateAggregateReport();
    expect(aggregate_report.subject).toMatch(/朝会報告集約/);
    expect(aggregate_report.formatted_reports).toHaveLength(1);
    expect(aggregate_report.formatted_reports[0]).toContain('tanaka@example.com');
    expect(aggregate_report.formatted_reports[0]).toContain('レビュー完了');
    expect(aggregate_report.formatted_reports[0]).toContain('テスト実施');
    expect(aggregate_report.formatted_reports[0]).toContain('なし');

    // 期待値: エージェント実行結果がサクセス
    expect(result).toEqual({
      status: 'success',
      message: '朝会報告集約と部長宛メール配信が完了しました',
      email_sent_to: 'bucho@example.com',
      summary: {
        submitted_count: 1,
        not_submitted_count: 9,
      },
    });
  });
});