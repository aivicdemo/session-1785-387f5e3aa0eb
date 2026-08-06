import { sendConfirmationEmailsToSubmitterAndManager } from '../../src/logic/it-1-br-1-1-1';

describe('日報統一フォーマット整形・表示機能', () => {
  // SCEN-238
  test('部員数がちょうど部長が一度に確認可能な上限数で全員分が表示される', () => {
    const max_displayable_reports = 10;
    const submission_count = 10;

    const reports_data = Array.from({ length: submission_count }, (_, idx) => ({
      report_id: `report_${idx + 1}`,
      user_id: `engineer_${idx + 1}`,
      user_name: `エンジニア${idx + 1}`,
      yesterday_achievement: `昨日の実績${idx + 1}`,
      today_plan: `本日の予定${idx + 1}`,
      current_issue: `抱えている課題${idx + 1}`,
      submitted_at: new Date('2024-01-15T08:00:00Z'),
      department_id: 'dev_dept_001',
      manager_id: 'manager_001',
    }));

    const result = sendConfirmationEmailsToSubmitterAndManager({
      reports: reports_data,
      manager_email: 'manager@company.com',
      system_email: 'noreply@system.com',
      report_display_limit: max_displayable_reports,
    });

    expect(result.displayed_report_count).toBe(10);
    expect(result.all_reports_fit_in_single_view).toBe(true);
    expect(result.formatted_reports).toHaveLength(10);

    result.formatted_reports.forEach((formatted_report, index) => {
      expect(formatted_report).toHaveProperty('report_id');
      expect(formatted_report).toHaveProperty('user_name');
      expect(formatted_report).toHaveProperty('yesterday_achievement');
      expect(formatted_report).toHaveProperty('today_plan');
      expect(formatted_report).toHaveProperty('current_issue');
      expect(formatted_report.yesterday_achievement).toBe(`昨日の実績${index + 1}`);
      expect(formatted_report.today_plan).toBe(`本日の予定${index + 1}`);
      expect(formatted_report.current_issue).toBe(`抱えている課題${index + 1}`);
    });

    expect(result.confirmation_emails_sent).toBe(true);
    expect(result.emails_recipients).toEqual({
      submitter_emails: reports_data.map((r) => `${r.user_id}@company.com`),
      manager_email: 'manager@company.com',
    });
  });
});