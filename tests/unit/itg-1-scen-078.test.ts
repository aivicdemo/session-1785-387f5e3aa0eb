import { sendReportWithConfirmationEmail } from '../../src/logic/it-2';

describe('送信時の自動確認メール通知', () => {
  // SCEN-078
  test('報告送信履歴レコードの保存に失敗したときエラーとなる', async () => {
    const report_user_id = 'user_123';
    const report_yesterday = '昨日は機能Aの実装を完了しました';
    const report_today = '本日は機能Bのテストを実施します';
    const report_issue = '外部APIの遅延により進捗が遅れています';
    const report_sent_at = new Date('2024-01-15T08:30:00Z');

    const history_save_error = new Error('報告送信履歴の保存に失敗しました');

    const mock_history_repository = {
      save: jest.fn().mockRejectedValueOnce(history_save_error),
    };

    const mock_email_service = {
      sendConfirmationEmail: jest.fn().mockResolvedValueOnce(undefined),
    };

    const payload = {
      user_id: report_user_id,
      yesterday: report_yesterday,
      today: report_today,
      issue: report_issue,
      sent_at: report_sent_at,
      history_repository: mock_history_repository,
      email_service: mock_email_service,
    };

    await expect(
      sendReportWithConfirmationEmail(payload),
    ).rejects.toThrow(/報告送信履歴の保存に失敗しました/);

    expect(mock_history_repository.save).toHaveBeenCalledTimes(1);
    expect(mock_email_service.sendConfirmationEmail).not.toHaveBeenCalled();
  });
});