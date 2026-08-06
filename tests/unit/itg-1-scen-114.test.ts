import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendConfirmationEmailWithDailyReport } from '../../src/logic/it-1';

const fetchMock = require('jest-fetch-mock');

describe('日報入力フォームの提供と送信機能', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-114
  test('確認メール自動配信機能 - 配信メールに今日の予定が記載される', async () => {
    const user_id = 'U001';
    const user_name = '田中太郎';
    const user_email = 'tanaka@example.com';
    const yesterday_achievement = '既存システムのバグ修正';
    const today_plan = '新機能の設計レビュー';
    const current_issue = 'データベース接続のタイムアウト問題';
    const report_date = '2024-01-15';
    const expected_subject_date = '2024-01-15';

    const mockDailyReport = {
      user_id: user_id,
      user_name: user_name,
      user_email: user_email,
      report_date: report_date,
      yesterday_achievement: yesterday_achievement,
      today_plan: today_plan,
      current_issue: current_issue,
    };

    const mockEmailResponse = {
      status: 'success',
      message: 'Email sent successfully',
      email_id: 'email-12345',
      sent_timestamp: '2024-01-15T09:00:00Z',
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockEmailResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await sendConfirmationEmailWithDailyReport(mockDailyReport);

    expect(result).toBeDefined();
    expect(result.status).toBe('success');
    expect(result.email_id).toBe('email-12345');

    const fetchCall = fetchMock.mock.calls[0];
    expect(fetchCall).toBeDefined();

    const requestUrl = fetchCall[0];
    const requestOptions = fetchCall[1];

    expect(requestUrl).toContain('/email/send');
    expect(requestOptions.method).toBe('POST');

    const requestBody = JSON.parse(requestOptions.body);

    expect(requestBody.recipient_email).toBe(user_email);
    expect(requestBody.recipient_name).toBe(user_name);
    expect(requestBody.subject).toContain(expected_subject_date);

    expect(requestBody.body).toContain(yesterday_achievement);
    expect(requestBody.body).toContain(today_plan);
    expect(requestBody.body).toContain(current_issue);

    expect(requestBody.body.includes(yesterday_achievement)).toBe(true);
    expect(requestBody.body.includes(today_plan)).toBe(true);
    expect(requestBody.body.includes(current_issue)).toBe(true);
  });
});