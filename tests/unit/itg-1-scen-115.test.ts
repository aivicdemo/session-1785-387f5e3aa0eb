import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendConfirmationEmailWithReport } from '../../src/logic/it-1';

const fetchMock = require('jest-fetch-mock');

describe('日報入力フォームの提供と送信機能', () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-115: [normal] 確認メール自動配信機能 - 配信メールに抱えている課題が記載される
  test('確認メール自動配信機能 - 配信メールに抱えている課題が記載される', async () => {
    const user_id = 'user_001';
    const user_name = 'ユーザーA';
    const admin_email = 'admin@example.com';
    const user_email = 'user_a@example.com';
    const yesterday_work = 'ドキュメント作成';
    const today_plan = 'レビュー実施';
    const challenge = 'システムA連携の遅延リスク';
    const report_date = '2024-01-15';

    const report_data = {
      user_id,
      user_name,
      user_email,
      yesterday_work,
      today_plan,
      challenge,
      report_date,
    };

    const expected_email_body_pattern = /抱えている課題.*システムA連携の遅延リスク/;

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        message: 'メール送信成功',
        sent_to: [admin_email, user_email],
      }),
      { status: 200 }
    );

    const result = await sendConfirmationEmailWithReport(report_data);

    expect(result).toEqual({
      success: true,
      message: 'メール送信成功',
      sent_to: [admin_email, user_email],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const call_args = fetchMock.mock.calls[0];
    const request_url = call_args[0];
    const request_options = call_args[1];

    expect(request_url).toContain('/api/send-confirmation-email');
    expect(request_options.method).toBe('POST');

    const request_body = JSON.parse(request_options.body);
    expect(request_body.user_id).toBe(user_id);
    expect(request_body.user_name).toBe(user_name);
    expect(request_body.user_email).toBe(user_email);
    expect(request_body.yesterday_work).toBe(yesterday_work);
    expect(request_body.today_plan).toBe(today_plan);
    expect(request_body.challenge).toBe(challenge);
    expect(request_body.report_date).toBe(report_date);

    expect(request_body.email_body).toMatch(expected_email_body_pattern);
    expect(request_body.email_body).toContain('ユーザーA');
    expect(request_body.email_body).toContain(yesterday_work);
    expect(request_body.email_body).toContain(today_plan);
  });
});