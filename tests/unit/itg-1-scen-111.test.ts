import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendDailyReportAndNotify } from '../../src/logic/it-1';

const fetchMock = require('jest-fetch-mock');

describe('日報入力フォームの提供と送信機能', () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-111
  test('[normal] 確認メール自動配信機能 - 送信者本人にメールが配信される', async () => {
    const user_id = 'user001';
    const email_address = 'user001@company.com';
    const user_name = '田中太郎';
    const yesterday_work = 'ドキュメント作成';
    const today_plan = 'テスト実施';
    const current_issue = 'サーバー接続の遅延';
    const submission_datetime = '2024-01-15T08:30:00Z';

    const send_mail_response = {
      mail_id: 'mail_20240115_001',
      recipient: email_address,
      status: 'sent',
    };

    fetchMock.mockResponseOnce(JSON.stringify(send_mail_response), {
      status: 200,
    });

    const result = await sendDailyReportAndNotify({
      user_id,
      email_address,
      user_name,
      yesterday_work,
      today_plan,
      current_issue,
      submission_datetime,
    });

    expect(result.report_id).toBeDefined();
    expect(result.report_id).toMatch(/^report_/);
    expect(result.status).toBe('sent');

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const call_args = fetchMock.mock.calls[0];
    const request_body = JSON.parse(call_args[1].body);

    expect(request_body.recipient).toBe(email_address);
    expect(request_body.subject).toMatch(/朝会報告/);
    expect(request_body.body).toContain(yesterday_work);
    expect(request_body.body).toContain(today_plan);
    expect(request_body.body).toContain(current_issue);
  });
});