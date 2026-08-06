import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

const fetchMock = require('jest-fetch-mock');

describe('報告送信時の確認メール自動配信機能 - DB接続エラーハンドリング', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-467: [error] 報告到着状況把握機能 - 朝会報告マスタテーブルへのアクセスが失敗したとき、エラーになる
  test('should return DB_CONNECTION_ERROR when morning_report master table access fails', async () => {
    const { getReportArrivalStatus } = await import('../../src/logic/it-1-br-1-1-1');

    const meetingTime = new Date('2024-01-15T09:00:00Z');
    const departmentId = 'dept_001';

    fetchMock.mockRejectOnce(new Error('Connection timeout'));

    let thrownError: any;
    try {
      await getReportArrivalStatus(meetingTime, departmentId);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError.code).toBe('DB_CONNECTION_ERROR');
    expect(thrownError.message).toMatch(/朝会報告マスタテーブルへのアクセスに失敗しました/);
  });
});