import { sendPromptionEmailOnReportMissing } from '../../src/logic/it-1-br-1-1-1';

const fetchMock = require('jest-fetch-mock');

describe('未報告催促メール通知機能 - メール送信失敗時の処理', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-514
  test('メール送信サービスが500エラーを返した場合、催促メール送信処理はエラーをキャッチしメール送信失敗ステータスを記録して中止する', async () => {
    const missing_user_id = 'user-002';
    const missing_user_name = '田中太郎';
    const missing_user_email = 'tanaka@example.com';
    const manager_id = 'user-mgr-001';
    const manager_name = '山田部長';
    const manager_email = 'yamada@example.com';
    const report_date = '2024-01-15';
    const meeting_start_time = '09:00';

    const input_request = {
      missing_user_id,
      missing_user_name,
      missing_user_email,
      manager_id,
      manager_name,
      manager_email,
      report_date,
      meeting_start_time,
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        error: 'Internal Server Error',
        code: 'MAIL_SERVICE_ERROR',
      }),
      { status: 500 }
    );

    const result = await sendPromptionEmailOnReportMissing(input_request);

    expect(result).toEqual({
      success: false,
      status: 'mail_send_failure',
      error_code: 'MAIL_SERVICE_ERROR',
      missing_user_id,
      report_date,
      sent_at: expect.any(String),
      email_sent_to: [],
      failure_reason: 'メール送信サービスエラー',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/mail/send'),
      expect.objectContaining({
        method: 'POST',
      })
    );
  });
});