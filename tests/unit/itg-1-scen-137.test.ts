import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateAndSendReport } from '../../src/logic/it-1';

const fetchMock = require('jest-fetch-mock');

describe('日報入力フォームの提供と送信機能', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    fetchMock.enableMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-137
  test('確認メール自動配信機能 - 送信内容の報告テキストが最大文字数ちょうどの場合、メール本文に正常に格納される', async () => {
    const maxReportTextLength = 500;
    const yesterdayTextLength = 166;
    const todayTextLength = 167;
    const challengeTextLength = 167;

    const yesterdayText = 'a'.repeat(yesterdayTextLength);
    const todayText = 'b'.repeat(todayTextLength);
    const challengeText = 'c'.repeat(challengeTextLength);

    const totalTextLength =
      yesterdayTextLength + todayTextLength + challengeTextLength;
    expect(totalTextLength).toBe(maxReportTextLength);

    const userId = 'user-123';
    const departmentId = 'dev-001';
    const sessionToken = 'session-token-abc';
    const reportDate = '2024-01-15';

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        sessionId: sessionToken,
        userId: userId,
        department: departmentId,
      }),
      { status: 200 },
    );

    const authResult = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'engineer-001', password: 'password' }),
    }).then((res) => res.json());

    expect(authResult.success).toBe(true);
    expect(authResult.sessionId).toBe(sessionToken);

    const capturedEmailBodies: string[] = [];

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        reportId: 'report-001',
        emailSentTo: ['engineer-001@company.com', 'manager-001@company.com'],
      }),
      { status: 200 },
    );

    const sendReportPayload = {
      sessionToken: sessionToken,
      userId: userId,
      departmentId: departmentId,
      reportDate: reportDate,
      yesterday: yesterdayText,
      today: todayText,
      challenge: challengeText,
    };

    const reportResult = await validateAndSendReport(sendReportPayload);

    expect(reportResult.success).toBe(true);
    expect(reportResult.reportId).toBe('report-001');

    expect(fetchMock.mock.calls.length).toBe(2);

    const sendReportCall = fetchMock.mock.calls[1];
    expect(sendReportCall[0]).toBe('/api/reports/send');

    const sentBody = JSON.parse(sendReportCall[1].body);
    expect(sentBody.yesterday).toBe(yesterdayText);
    expect(sentBody.today).toBe(todayText);
    expect(sentBody.challenge).toBe(challengeText);

    const sentYesterdayLength = sentBody.yesterday.length;
    const sentTodayLength = sentBody.today.length;
    const sentChallengeLength = sentBody.challenge.length;
    const sentTotalLength =
      sentYesterdayLength + sentTodayLength + sentChallengeLength;

    expect(sentTotalLength).toBe(maxReportTextLength);
    expect(sentYesterdayLength).toBe(yesterdayTextLength);
    expect(sentTodayLength).toBe(todayTextLength);
    expect(sentChallengeLength).toBe(challengeTextLength);

    const emailContent = `Yesterday: ${sentBody.yesterday}\nToday: ${sentBody.today}\nChallenge: ${sentBody.challenge}`;
    const emailYesterdayPart = emailContent.substring(
      emailContent.indexOf('Yesterday: ') + 11,
      emailContent.indexOf('\nToday: '),
    );
    const emailTodayPart = emailContent.substring(
      emailContent.indexOf('Today: ') + 7,
      emailContent.indexOf('\nChallenge: '),
    );
    const emailChallengePart = emailContent.substring(
      emailContent.indexOf('Challenge: ') + 11,
    );

    expect(emailYesterdayPart).toBe(yesterdayText);
    expect(emailTodayPart).toBe(todayText);
    expect(emailChallengePart).toBe(challengeText);

    expect(emailYesterdayPart.length).toBe(yesterdayTextLength);
    expect(emailTodayPart.length).toBe(todayTextLength);
    expect(emailChallengePart.length).toBe(challengeTextLength);
  });
});