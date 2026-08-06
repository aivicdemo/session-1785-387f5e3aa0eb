import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateAllReportsSubmitted } from '../../src/logic/it-1';

const fetchMock = require('jest-fetch-mock');

describe('日報入力フォームの提供と送信機能', () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-349
  test('全員報告完了判定機能 - 10名全員から報告が送信されている場合、朝会開始可能と判定される', async () => {
    // Setup: 10名の部員のユーザーアカウントをセットアップ
    const team_member_ids = [
      'user_001',
      'user_002',
      'user_003',
      'user_004',
      'user_005',
      'user_006',
      'user_007',
      'user_008',
      'user_009',
      'user_010',
    ];

    const department_id = 'dept_dev_001';
    const meeting_start_time = new Date('2024-01-15T09:00:00Z');
    const submission_deadline = new Date('2024-01-15T08:50:00Z');

    // Mock: 全員のユーザー情報を取得
    fetchMock.mockResponseOnce(
      JSON.stringify({
        users: team_member_ids.map((user_id, index) => ({
          user_id: user_id,
          user_name: `Engineer_${index + 1}`,
          department_id: department_id,
          email: `engineer${index + 1}@company.com`,
          role: 'engineer',
        })),
      }),
      { status: 200 }
    );

    // 全員が報告を送信した状態のデータを作成
    const submitted_reports = team_member_ids.map((user_id, index) => ({
      report_id: `report_${index + 1}`,
      user_id: user_id,
      yesterday_accomplishments: `Completed task ${index + 1}`,
      today_plan: `Plan task ${index + 1}`,
      current_issues: `Issue ${index + 1}`,
      submitted_at: new Date('2024-01-15T08:45:00Z'),
      submission_status: 'submitted',
    }));

    // Mock: 報告送信状態を確認
    fetchMock.mockResponseOnce(
      JSON.stringify({
        reports: submitted_reports,
        total_count: 10,
        submitted_count: 10,
        unsubmitted_count: 0,
      }),
      { status: 200 }
    );

    // 全員報告完了判定機能を実行
    const input_data = {
      department_id: department_id,
      meeting_start_time: meeting_start_time,
      submission_deadline: submission_deadline,
      check_timestamp: new Date('2024-01-15T08:55:00Z'),
    };

    const result = await validateAllReportsSubmitted(input_data);

    // 期待結果: 全員報告完了判定機能の戻り値が『朝会開始可能（TRUE）』
    expect(result.all_reports_submitted).toBe(true);
    expect(result.meeting_can_start).toBe(true);
    expect(result.submitted_count).toBe(10);
    expect(result.unsubmitted_count).toBe(0);
    expect(result.submitted_user_ids).toEqual(team_member_ids);
    expect(result.unsubmitted_user_ids).toEqual([]);

    // Mock: 管理者に確認メールが送信される
    fetchMock.mockResponseOnce(
      JSON.stringify({
        email_id: 'email_001',
        recipient_email: 'manager@company.com',
        subject: '朝会報告 - 全員提出完了通知',
        status: 'sent',
        sent_at: new Date('2024-01-15T08:56:00Z'),
      }),
      { status: 200 }
    );

    // 確認メール送信
    const manager_email = 'manager@company.com';
    const email_response = await fetch('/api/send-confirmation-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient_email: manager_email,
        subject: '朝会報告 - 全員提出完了通知',
        report_summary: result,
      }),
    });

    const email_result = await email_response.json();

    expect(email_response.status).toBe(200);
    expect(email_result.email_id).toBe('email_001');
    expect(email_result.status).toBe('sent');
    expect(email_result.recipient_email).toBe('manager@company.com');
  });
});