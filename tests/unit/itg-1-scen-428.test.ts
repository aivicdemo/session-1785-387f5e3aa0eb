import { sendNotificationEmailToNonSubmitterList } from '../../src/logic/it-1-br-1-1-1';

const fetchMock = require('jest-fetch-mock');

describe('未提出部員通知機能 - メール送信外部サービス障害時エラーハンドリング', () => {
  // SCEN-428
  test('メール送信が外部サービス障害で失敗したときエラーになる', async () => {
    fetchMock.resetMocks();

    const nonSubmitterList = [
      {
        userId: 'ENG001',
        userName: '田中太郎',
        email: 'tanaka@example.com',
        departmentId: 'DEV',
        departmentName: '開発部',
      },
      {
        userId: 'ENG002',
        userName: '鈴木花子',
        email: 'suzuki@example.com',
        departmentId: 'DEV',
        departmentName: '開発部',
      },
    ];

    const meetingStartTime = new Date('2024-01-15T09:00:00Z');
    const submissionDeadline = new Date('2024-01-15T08:50:00Z');

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: false,
        error: '外部メール配信サービスへの接続に失敗しました',
        errorCode: 'SMTP_CONNECTION_FAILED',
        statusCode: 503,
      }),
      { status: 503 }
    );

    const result = await sendNotificationEmailToNonSubmitterList(
      nonSubmitterList,
      meetingStartTime,
      submissionDeadline
    );

    expect(result.success).toBe(false);
    expect(result.errorMessage).toMatch(/メール送信/);
    expect(result.errorCode).toBe('EXTERNAL_SERVICE_ERROR');
    expect(result.statusCode).toBe(503);
    expect(result.nonSubmitterListUnchanged).toBe(true);
    expect(result.retryable).toBe(true);
    expect(result.logEntry).toMatch(/外部サービス障害/);
  });
});