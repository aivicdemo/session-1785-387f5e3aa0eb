import { sendDailyReportConfirmationEmail } from '../../src/logic/it-1-br-1-1-1';

describe('報告送信時に、送信者本人と部長宛に確認メールを自動配信する機能', () => {
  // SCEN-206
  test('朝会開始予定時刻より後の時刻では、日報送信状況確認対象外として処理がスキップされ、部長への確認メールが送信されない', () => {
    const morning_meeting_start_time = new Date('2024-01-15T09:00:00Z');
    const current_time = new Date('2024-01-15T09:30:00Z');
    const reporter_user_id = 'user_001';
    const reporter_email = 'engineer@example.com';
    const department_head_email = 'head@example.com';
    const report_content = {
      yesterday_accomplishment: '前日にタスクAを完了した',
      today_plan: '本日はタスクBを実施予定',
      current_issues: 'タスクCで技術的課題がある'
    };

    const send_email_spy = jest.fn();

    const result = sendDailyReportConfirmationEmail({
      morning_meeting_start_time,
      current_time,
      reporter_user_id,
      reporter_email,
      department_head_email,
      report_content,
      send_email_callback: send_email_spy
    });

    expect(result.processing_skipped).toBe(true);
    expect(result.reason).toMatch(/朝会開始時刻/);
    expect(send_email_spy).not.toHaveBeenCalled();
  });
});