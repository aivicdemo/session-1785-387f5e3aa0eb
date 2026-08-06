import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

const fetchMock = require('jest-fetch-mock');

describe('朝会報告送信時刻遅延判定機能 - 送信者メールアドレスの形式が不正なとき処理が失敗する', () => {
  // SCEN-269
  test('送信者メールアドレスが不正な形式の場合、メール送信が実行されず、エラーメッセージが返却される', async () => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();

    // Import the function to test
    const { sendMorningReportWithEmailNotification } = await import(
      '../../src/logic/it-1-br-1-1-1'
    );

    const reportData = {
      userId: 'user-001',
      senderEmail: 'user@domain', // Invalid email format (missing TLD)
      managerEmail: 'manager@example.com',
      yesterdayAccomplishment: 'Completed task A and task B',
      todayPlan: 'Plan to work on task C and task D',
      challengesFaced: 'Network connectivity issue',
      sentAt: new Date('2024-01-15T08:30:00Z'),
      morningMeetingStartTime: new Date('2024-01-15T09:00:00Z'),
    };

    let errorOccurred = false;
    let errorMessage = '';

    try {
      await sendMorningReportWithEmailNotification(reportData);
    } catch (error: unknown) {
      errorOccurred = true;
      if (error instanceof Error) {
        errorMessage = error.message;
      }
    }

    // Verify that an error occurred
    expect(errorOccurred).toBe(true);

    // Verify error message contains the expected keyword
    expect(errorMessage).toMatch(/送信者メールアドレス/);

    // Verify that fetch (email sending) was never called
    expect(fetchMock.mock.calls.length).toBe(0);
  });
});