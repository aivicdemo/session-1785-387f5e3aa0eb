import { describe, test, expect, beforeEach, jest } from '@jest/globals';

describe('未報告部員催促通知機能 - 朝会開始15分前未満での催促スキップ', () => {
  // SCEN-520
  test('朝会開始予定時刻の15分前を1秒未満の時点で未報告者が1名以上いる場合、催促メッセージが部長に通知されない', async () => {
    const { sendPromptionEmailToDepartmentHead } = await import(
      '../../src/logic/it-1-br-1-1-1'
    );

    const meeting_start_time = new Date('2024-01-15T09:00:00Z');
    const current_time_before_cutoff = new Date('2024-01-15T08:44:59Z');

    const unreported_members = [
      {
        user_id: 'user_001',
        user_name: 'Engineer A',
        department_id: 'dept_dev',
      },
      {
        user_id: 'user_002',
        user_name: 'Engineer B',
        department_id: 'dept_dev',
      },
      {
        user_id: 'user_003',
        user_name: 'Engineer C',
        department_id: 'dept_dev',
      },
    ];

    const reported_members = [
      {
        user_id: 'user_004',
        user_name: 'Engineer D',
        department_id: 'dept_dev',
        report_sent_at: new Date('2024-01-15T08:30:00Z'),
      },
      {
        user_id: 'user_005',
        user_name: 'Engineer E',
        department_id: 'dept_dev',
        report_sent_at: new Date('2024-01-15T08:35:00Z'),
      },
      {
        user_id: 'user_006',
        user_name: 'Engineer F',
        department_id: 'dept_dev',
        report_sent_at: new Date('2024-01-15T08:40:00Z'),
      },
      {
        user_id: 'user_007',
        user_name: 'Engineer G',
        department_id: 'dept_dev',
        report_sent_at: new Date('2024-01-15T08:25:00Z'),
      },
      {
        user_id: 'user_008',
        user_name: 'Engineer H',
        department_id: 'dept_dev',
        report_sent_at: new Date('2024-01-15T08:32:00Z'),
      },
      {
        user_id: 'user_009',
        user_name: 'Engineer I',
        department_id: 'dept_dev',
        report_sent_at: new Date('2024-01-15T08:38:00Z'),
      },
      {
        user_id: 'user_010',
        user_name: 'Engineer J',
        department_id: 'dept_dev',
        report_sent_at: new Date('2024-01-15T08:42:00Z'),
      },
    ];

    const department_head_user_id = 'user_dept_head_001';

    const mock_send_email = jest.fn<(...args: any[]) => any>().mockResolvedValue({
      email_send_log_id: 'log_mock_001',
      recipient_email: 'head@company.com',
      sent_at: current_time_before_cutoff,
      status: 'not_sent',
    });

    const result = await sendPromptionEmailToDepartmentHead(
      {
        meeting_start_time,
        current_time: current_time_before_cutoff,
        unreported_members,
        reported_members,
        department_head_user_id,
      },
      mock_send_email
    );

    expect(mock_send_email).not.toHaveBeenCalled();
    expect(result.email_sent).toBe(false);
    expect(result.reason).toBe('not_within_cutoff_window');
  });
});