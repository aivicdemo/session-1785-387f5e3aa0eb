import { describe, test, expect, beforeEach } from '@jest/globals';
import { sendConfirmationEmailWithReportAggregation } from '../../src/logic/it-1-br-1-1-1';

describe('確認メール配信・日報一覧集約機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-317
  test('月初00時00分00秒に日報が送信された時、確認メール集約に含まれる送信日時が正確に記録される', () => {
    const report_submission_time = new Date('2024-01-01T00:00:00.000Z');
    const sender_user_id = 'user_001';
    const sender_name = '部員1';
    const department_head_user_id = 'head_001';
    const department_head_email = 'head@example.com';
    const sender_email = 'user@example.com';
    const yesterday_achievement = '前日のプロジェクトA実装完了';
    const today_plan = '本日のプロジェクトB設計開始';
    const current_issue = '統合テスト環境のデータベース接続問題';

    const report_data = {
      sender_user_id: sender_user_id,
      sender_name: sender_name,
      sender_email: sender_email,
      yesterday_achievement: yesterday_achievement,
      today_plan: today_plan,
      current_issue: current_issue,
      submission_timestamp: report_submission_time,
    };

    const department_head_info = {
      user_id: department_head_user_id,
      email: department_head_email,
      name: '開発部長',
    };

    const confirmation_email_result = sendConfirmationEmailWithReportAggregation(
      report_data,
      department_head_info
    );

    expect(confirmation_email_result.status).toBe('success');
    expect(confirmation_email_result.confirmation_email_payload).toBeDefined();

    const email_payload = confirmation_email_result.confirmation_email_payload;
    expect(email_payload.recipient_email).toBe(department_head_email);

    expect(email_payload.aggregated_reports).toBeDefined();
    expect(Array.isArray(email_payload.aggregated_reports)).toBe(true);
    expect(email_payload.aggregated_reports.length).toBeGreaterThan(0);

    const submitted_report = email_payload.aggregated_reports.find(
      (r: any) => r.sender_user_id === sender_user_id
    );
    expect(submitted_report).toBeDefined();

    expect(submitted_report.submission_timestamp).toBe('2024-01-01T00:00:00.000Z');
    expect(submitted_report.sender_name).toBe(sender_name);
    expect(submitted_report.yesterday_achievement).toBe(yesterday_achievement);
    expect(submitted_report.today_plan).toBe(today_plan);
    expect(submitted_report.current_issue).toBe(current_issue);

    expect(confirmation_email_result.sender_confirmation_email_payload).toBeDefined();
    const sender_email_payload = confirmation_email_result.sender_confirmation_email_payload;
    expect(sender_email_payload.recipient_email).toBe(sender_email);
    expect(sender_email_payload.report_submission_confirmation).toBeDefined();
    expect(sender_email_payload.report_submission_confirmation.submission_timestamp).toBe(
      '2024-01-01T00:00:00.000Z'
    );
    expect(sender_email_payload.report_submission_confirmation.yesterday_achievement).toBe(
      yesterday_achievement
    );
    expect(sender_email_payload.report_submission_confirmation.today_plan).toBe(today_plan);
    expect(sender_email_payload.report_submission_confirmation.current_issue).toBe(
      current_issue
    );
  });
});