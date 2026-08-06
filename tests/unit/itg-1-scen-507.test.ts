import { sendConfirmationEmailsOnReportSubmit } from '../../src/logic/it-1-br-1-1-1';

describe('報告送信時の確認メール自動配信機能', () => {
  test('SCEN-507: 報告送信履歴が null の場合、未報告と判定し催促対象として処理される', () => {
    // Arrange
    const user_id = '001';
    const department_id = 'DEV';
    const submission_date = '2024-01-15';
    const yesterday_achievement = '前日のタスク完了';
    const todays_plan = '本日の予定';
    const current_issues = '現在の課題';
    const manager_email = 'manager@example.com';
    const reporter_email = 'reporter@example.com';

    const mock_report_data = {
      user_id: user_id,
      department_id: department_id,
      submission_date: submission_date,
      yesterday_achievement: yesterday_achievement,
      todays_plan: todays_plan,
      current_issues: current_issues,
      reporter_email: reporter_email,
      manager_email: manager_email,
    };

    const mock_submission_history = null;

    const mock_sent_emails: Array<{
      recipient: string;
      subject: string;
      body: string;
      sent_at: string;
    }> = [];
    const mock_error_logs: Array<{
      user_id: string;
      message: string;
      timestamp: string;
    }> = [];

    const test_result = sendConfirmationEmailsOnReportSubmit(
      mock_report_data,
      mock_submission_history,
      mock_sent_emails,
      mock_error_logs
    );

    // Assert
    expect(test_result.is_unreported).toBe(true);
    expect(test_result.should_send_reminder).toBe(true);
    expect(mock_error_logs.length).toBe(1);
    expect(mock_error_logs[0].user_id).toBe(user_id);
    expect(mock_error_logs[0].message).toMatch(/報告送信履歴.*null.*未報告/);
    expect(mock_sent_emails.length).toBe(2);
    expect(mock_sent_emails.some((e) => e.recipient === reporter_email)).toBe(
      true
    );
    expect(mock_sent_emails.some((e) => e.recipient === manager_email)).toBe(
      true
    );
    expect(test_result.process_continued).toBe(true);
  });
});