import { sendConfirmationEmailsForDailyReport } from '../../src/logic/it-2';

describe('確認メール自動配信機能 - 部長へのメール送信失敗時のエラーハンドリング', () => {
  // SCEN-080
  test('部長へのメール送信が失敗したときエラーが記録され、日報は送信完了状態にならない', async () => {
    const engineer_user_id = 'user_001';
    const engineer_email = 'engineer@example.com';
    const engineer_name = '田中太郎';
    const department_id = 'dept_001';
    const department_name = '開発部';
    const manager_user_id = 'manager_001';
    const manager_email = 'manager@example.com';
    const manager_name = '佐藤部長';
    const report_date = '2024-01-15';
    const yesterday_achievement = '昨日は機能A の実装を完了しました';
    const today_plan = '本日は機能B のテストを開始します';
    const current_issue = '機能C の仕様が不明確です';
    const submitted_at = '2024-01-15T07:30:00Z';

    const daily_report_data = {
      engineer_user_id,
      engineer_email,
      engineer_name,
      department_id,
      department_name,
      manager_user_id,
      manager_email,
      manager_name,
      report_date,
      yesterday_achievement,
      today_plan,
      current_issue,
      submitted_at,
    };

    const mock_email_log_entries: any[] = [];
    const mock_error_logs: any[] = [];

    const mock_send_email = jest.fn(async (recipient_email: string, subject: string, body: string) => {
      const log_entry = {
        recipient_email,
        subject,
        body,
        sent_at: new Date().toISOString(),
        status: 'pending' as const,
      };
      mock_email_log_entries.push(log_entry);

      if (recipient_email === manager_email) {
        const error = new Error('SMTP接続失敗');
        throw error;
      }

      log_entry.status = 'sent';
      return { success: true };
    });

    const mock_log_error = jest.fn((error_message: string, error_details?: any) => {
      mock_error_logs.push({
        message: error_message,
        details: error_details,
        timestamp: new Date().toISOString(),
      });
    });

    const mock_save_daily_report = jest.fn(async (report_data: any) => {
      return {
        report_id: 'report_001',
        ...report_data,
        status: 'submitted' as const,
      };
    });

    let thrown_error: any = null;

    try {
      await sendConfirmationEmailsForDailyReport(
        daily_report_data,
        {
          sendEmail: mock_send_email,
          logError: mock_log_error,
          saveDailyReport: mock_save_daily_report,
        }
      );
    } catch (error) {
      thrown_error = error;
    }

    expect(thrown_error).toBeDefined();
    expect(thrown_error?.message).toMatch(/部長へのメール送信失敗/);

    expect(mock_error_logs.length).toBeGreaterThan(0);
    const error_log_found = mock_error_logs.some((log) =>
      log.message.includes('部長へのメール送信失敗')
    );
    expect(error_log_found).toBe(true);

    expect(mock_save_daily_report).not.toHaveBeenCalled();

    expect(mock_send_email).toHaveBeenCalledWith(
      manager_email,
      expect.stringContaining('日報確認'),
      expect.any(String)
    );
  });
});