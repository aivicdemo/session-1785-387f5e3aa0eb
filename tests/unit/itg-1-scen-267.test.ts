import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateAndSendConfirmationEmail } from '../../src/logic/it-1-br-1-1-1';

const fetchMock = require('jest-fetch-mock');

describe('朝会報告送信時に確認メール自動配信 - タイムスタンプ形式検証', () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-267
  test('報告送信タイムスタンプの形式が不正なとき処理が失敗する', () => {
    const reportData = {
      reportId: 'RPT-20240115-001',
      userId: 'ENG-002',
      userName: '山田太郎',
      departmentId: 'DEV-001',
      departmentName: '開発部',
      managerEmail: 'manager@company.com',
      userEmail: 'yamada@company.com',
      yesterdayResult: '前日はバグ修正を完了した',
      todayPlan: '本日は新機能開発を進める',
      challenges: 'API連携で問題が発生している',
      reportContent: {
        yesterdayResult: '前日はバグ修正を完了した',
        todayPlan: '本日は新機能開発を進める',
        challenges: 'API連携で問題が発生している'
      },
      morningMeetingStartTime: new Date('2024-01-15T09:00:00Z')
    };

    const invalidTimestamps = [
      '2024-13-45 25:70:99',
      'invalid-timestamp',
      null,
      undefined,
      '',
      '2024/01/15 09:00:00',
      'Mon Jan 15 2024'
    ];

    invalidTimestamps.forEach((invalidTimestamp) => {
      const invalidReportData = {
        ...reportData,
        reportSentAt: invalidTimestamp as any
      };

      expect(() => {
        validateAndSendConfirmationEmail(invalidReportData);
      }).toThrow(/タイムスタンプ/);
    });
  });
});