import { sendReportWithEmailNotification } from '../../src/logic/it-1-br-1-1-1';

describe('朝会報告送信時に送信者本人と部長宛に確認メールを自動配信する機能', () => {
  // SCEN-272: [edge] 朝会報告送信時刻判定機能 - 送信時刻が朝会開始時刻とちょうど同じ場合、遅延なしと判定される
  test('送信時刻が朝会開始時刻と一致する場合、遅延フラグはfalseで送信完了となること', () => {
    const meeting_start_time = new Date('2024-01-15T09:00:00Z');
    const report_sent_at = new Date('2024-01-15T09:00:00Z');
    const user_id = 'ENG001';
    const user_email = 'engineer@example.com';
    const manager_id = 'MGR001';
    const manager_email = 'manager@example.com';
    const report_yesterday = 'Yesterday task completed';
    const report_today = 'Today plan scheduled';
    const report_issue = 'Issue identified';
    const report_date = '2024-01-15';

    const result = sendReportWithEmailNotification({
      meeting_start_time: meeting_start_time,
      report_sent_at: report_sent_at,
      user_id: user_id,
      user_email: user_email,
      manager_id: manager_id,
      manager_email: manager_email,
      report_yesterday: report_yesterday,
      report_today: report_today,
      report_issue: report_issue,
      report_date: report_date,
    });

    expect(result.is_delayed).toBe(false);
    expect(result.status).toBe('送信完了');
    expect(result.notification_sent_to_user).toBe(true);
    expect(result.notification_sent_to_manager).toBe(true);
  });
});