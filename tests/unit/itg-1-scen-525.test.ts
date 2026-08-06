import { sendConfirmationEmailsToReporterAndManager } from '../../src/logic/it-1-br-1-1-1';

describe('報告送信時の確認メール自動配信機能', () => {
  // SCEN-525
  test('朝会開始予定時刻の30分前までに全員の報告が到着している場合、15分前時点でも催促メッセージは送信されない', () => {
    const meeting_start_time = new Date('2024-01-15T09:00:00Z');
    const all_reporters_submitted_by = new Date('2024-01-15T08:30:00Z');
    const notification_check_time = new Date('2024-01-15T08:45:00Z');

    const reporter_list = [
      { user_id: 'USER_001', user_name: 'Engineer A', department_id: 'DEPT_DEV', email: 'a@example.com' },
      { user_id: 'USER_002', user_name: 'Engineer B', department_id: 'DEPT_DEV', email: 'b@example.com' },
      { user_id: 'USER_003', user_name: 'Engineer C', department_id: 'DEPT_DEV', email: 'c@example.com' },
      { user_id: 'USER_004', user_name: 'Engineer D', department_id: 'DEPT_DEV', email: 'd@example.com' },
      { user_id: 'USER_005', user_name: 'Engineer E', department_id: 'DEPT_DEV', email: 'e@example.com' },
      { user_id: 'USER_006', user_name: 'Engineer F', department_id: 'DEPT_DEV', email: 'f@example.com' },
      { user_id: 'USER_007', user_name: 'Engineer G', department_id: 'DEPT_DEV', email: 'g@example.com' },
      { user_id: 'USER_008', user_name: 'Engineer H', department_id: 'DEPT_DEV', email: 'h@example.com' },
      { user_id: 'USER_009', user_name: 'Engineer I', department_id: 'DEPT_DEV', email: 'i@example.com' },
      { user_id: 'USER_010', user_name: 'Engineer J', department_id: 'DEPT_DEV', email: 'j@example.com' },
    ];

    const submission_records = reporter_list.map(reporter => ({
      user_id: reporter.user_id,
      submitted_at: all_reporters_submitted_by,
      report_content: {
        yesterday_achievement: 'Completed task X',
        today_plan: 'Plan task Y',
        issue: 'No issues',
      },
    }));

    const manager_info = {
      user_id: 'MANAGER_001',
      user_name: 'Development Manager',
      email: 'manager@example.com',
    };

    const sent_emails: Array<{ recipient_email: string; subject: string; body: string }> = [];

    const mock_email_service = {
      send: jest.fn((recipient_email: string, subject: string, body: string) => {
        sent_emails.push({ recipient_email, subject, body });
        return Promise.resolve({ success: true });
      }),
    };

    const input_payload = {
      meeting_start_time,
      current_check_time: notification_check_time,
      reporters: reporter_list,
      submissions: submission_records,
      manager: manager_info,
      email_service: mock_email_service,
    };

    const result = sendConfirmationEmailsToReporterAndManager(input_payload);

    expect(result.reminder_emails_sent_count).toBe(0);
    expect(mock_email_service.send).not.toHaveBeenCalled();
    expect(sent_emails.length).toBe(0);
  });
});