import { submitDailyReport } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-153: [error] 日報送信重複チェック機能 - 報告送信履歴レコードの作成が失敗したとき送信を拒否する
  test('送信履歴レコード作成が失敗した場合、送信処理が中断され、メールが送信されず、日報がDB保存されない', async () => {
    const user_id = 'eng_001';
    const report_date = '2024-01-15';
    const yesterday_achievement = '前日にタスク A を完了';
    const today_plan = '本日はタスク B を開始';
    const current_issue = '環境構築に時間がかかっている';

    const submission_history_error = new Error('Database connection failed');

    const mockSubmissionHistoryCreate = jest
      .fn()
      .mockRejectedValueOnce(submission_history_error);

    const mockReportCreate = jest.fn().mockResolvedValueOnce({
      report_id: 'rpt_001',
      user_id,
      report_date,
      yesterday_achievement,
      today_plan,
      current_issue,
      created_at: '2024-01-15T08:00:00Z',
    });

    const mockEmailSend = jest.fn().mockResolvedValueOnce({
      email_log_id: 'log_001',
      sent_at: '2024-01-15T08:00:01Z',
    });

    const input_payload = {
      user_id,
      report_date,
      yesterday_achievement,
      today_plan,
      current_issue,
      submission_history_create_fn: mockSubmissionHistoryCreate,
      report_create_fn: mockReportCreate,
      email_send_fn: mockEmailSend,
    };

    await expect(submitDailyReport(input_payload)).rejects.toThrow(/送信に失敗/);

    expect(mockReportCreate).not.toHaveBeenCalled();
    expect(mockEmailSend).not.toHaveBeenCalled();
    expect(mockSubmissionHistoryCreate).toHaveBeenCalledTimes(1);
  });
});